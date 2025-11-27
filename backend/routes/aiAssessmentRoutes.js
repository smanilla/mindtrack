const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Assessment = require('../models/Assessment');

// Optional Gemini setup (fallback to local summarizer if not configured)
let useGemini = false;
let geminiClient = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GOOGLE_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    geminiClient = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    useGemini = true;
  }
} catch (e) {
  useGemini = false;
}

// Nodemailer (optional) setup
const ENABLE_ALERT_EMAILS = process.env.ENABLE_ALERT_EMAILS === 'true';
let transporter = null;
try {
  const nodemailer = require('nodemailer');
  if (ENABLE_ALERT_EMAILS && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
} catch (_) {}

const QUESTIONS = [
  'How would you describe your overall mood today?',
  'What was the most significant event of your day?',
  'Did anything trigger strong emotions? If yes, what and how did you feel?',
  'How were your energy levels and motivation today?',
  'How many hours did you sleep last night and how was the sleep quality?',
  'Did you engage in any physical activity or self-care? Describe briefly.',
  'How were your interactions with others (family, friends, colleagues)?',
  'What thoughts kept recurring in your mind today?',
  'What coping strategies did you use? Did they help?',
  'Is there anything worrying you right now that you’d like support with?'
];

function detectCrisisStrict(text) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  // Only self-harm or crime signals
  const phrases = [
    'kill myself', 'end my life', 'suicide', 'self harm', 'self-harm',
    'hurt myself', 'die by suicide', 'i want to die', 'end me',
    'harm myself', 'cut myself', 'overdose', 'take my life',
    'commit a crime', 'rob', 'murder', 'assault', 'rape', 'bomb', 'terror'
  ];
  if (phrases.some(p => t.includes(p))) return true;
  // simple pattern for typos like "filling like ending me"
  const feelEndPattern = /(feel|feeling|filling)[^\n]{0,20}(end|kill|die|suicide)/i;
  return feelEndPattern.test(t);
}

async function summarizeAnswers(answers) {
  const content = answers
    .map((a, i) => `Q${i + 1}: ${QUESTIONS[i]}\nA${i + 1}: ${a}`)
    .join('\n\n');

  const prompt = `You are a supportive, ethical mental-health assistant.
Summarize the user's day based on the Q&A below in ~150 words.
Use compassionate, non-judgmental language, include 2-3 strengths or supports, and 2 concrete next steps.
Do not claim to be a therapist. Include a brief disclaimer that you are an AI.
\n\n${content}`;

  if (useGemini && geminiClient) {
    try {
      const result = await geminiClient.generateContent(prompt);
      const text = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (_) {
      // fall through to local summarizer
    }
  }
  // Fallback summarizer
  return `Here is a brief summary of your day based on your responses: you experienced a mix of emotions and identified key events and stressors. You showed awareness of triggers and coping strategies, and acknowledged your needs around sleep, energy, and connection. Strengths I notice: your self-awareness, willingness to reflect, and effort to care for yourself. Consider two small next steps: (1) schedule one supportive activity (walk, call a friend, journaling) and (2) set a realistic sleep routine tonight. I am an AI providing general emotional support, not a licensed therapist.`;
}

async function sendRedAlertEmails({ requester, summary, answers, extraContacts = [] }) {
  if (!ENABLE_ALERT_EMAILS) return { sent: false, reason: 'mail_disabled' };
  if (!transporter) return { sent: false, reason: 'mail_not_configured' };

  const recipients = new Set();
  // Patient's doctor (if linked)
  if (requester?.doctor) {
    const doctor = await User.findById(requester.doctor).select('email name');
    if (doctor?.email) recipients.add(doctor.email);
  }
  // Optional extra contacts from request
  for (const e of extraContacts) if (e && /@/.test(e)) recipients.add(e);

  if (recipients.size === 0) return { sent: false, reason: 'no_recipients' };

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER,
    to: Array.from(recipients).join(','),
    subject: 'MindTrack Red Alert: Immediate Attention Recommended',
    text: `A potential crisis was detected for ${requester?.name || 'a patient'} (${requester?.email}).\n\nSummary:\n${summary}\n\nRecent Q&A:\n${answers.map((a,i)=>`Q${i+1}: ${QUESTIONS[i]}\nA${i+1}: ${a}`).join('\n\n')}\n\nPlease reach out as appropriate.`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: 'send_failed', error: String(e) };
  }
}

// GET /start -> returns the 10 questions
router.get('/start', protect, async (req, res) => {
  res.json({ questions: QUESTIONS });
});

// POST /submit -> { answers: string[10], contacts?: string[] }
router.post('/submit', protect, async (req, res) => {
  try {
    const { answers, contacts } = req.body || {};
    if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
      return res.status(400).json({ message: `Please provide ${QUESTIONS.length} answers.` });
    }

    const joined = answers.join('\n\n');
    const crisis = detectCrisisStrict(joined);
    const summary = await summarizeAnswers(answers);

    // Persist assessment
    const doc = await Assessment.create({
      user: req.user._id,
      answers,
      summary,
      crisis
    });

    let mail = { sent: false };
    if (crisis) {
      mail = await sendRedAlertEmails({ requester: req.user, summary, answers, extraContacts: contacts || [] });
    }

    res.json({ id: doc._id, summary, crisis, mail, createdAt: doc.createdAt });
  } catch (e) {
    console.error('Assessment submit error:', e);
    res.status(500).json({ message: 'Failed to process assessment' });
  }
});

// GET /mine -> current user's assessments (newest first)
router.get('/mine', protect, async (req, res) => {
  try {
    const items = await Assessment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('summary crisis createdAt');
    res.json(items);
  } catch (e) {
    console.error('Assessment mine error:', e);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
});

module.exports = router;


