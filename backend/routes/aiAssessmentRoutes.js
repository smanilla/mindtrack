const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Middleware for parsing form-encoded data (for Twilio callbacks)
router.use(express.urlencoded({ extended: true }));
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

// Twilio (optional) setup for voice calls
const ENABLE_VOICE_CALLS = process.env.ENABLE_VOICE_CALLS === 'true';
let twilioClient = null;
try {
  if (ENABLE_VOICE_CALLS && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
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
  // Fallback summarizer - generate varied summaries based on content with improved sentiment detection
  const allAnswers = answers.join(' ').toLowerCase();
  
  // Improved negative sentiment detection
  const negativePatterns = /bad|terrible|awful|horrible|worst|depressed|sad|down|low|hopeless|worthless|empty|numb|disappointed|frustrated|angry|upset|hurt|disrespected|not good|not too good|pretty bad|feeling bad|struggling|difficult|hard|challenging|overwhelmed|exhausted|drained|tired|fatigued|no energy|low energy|poor|worse|declining|worrying|concerned|anxious|stress|stressed|panic|fear|scared|afraid|lonely|isolated|alone|rejected|abandoned|betrayed|hurt|pain|suffering|distress|misery|sorrow|grief|despair|desperate|helpless|powerless|stuck|trapped|ending|suicide|self-harm|kill|die|death|worthless|burden|better off without|no point|no reason|give up|quit|nothing helps|nothing works|no hope|no future/i;
  
  // Positive sentiment detection
  const positivePatterns = /good|great|excellent|wonderful|amazing|fantastic|happy|joy|joyful|pleased|content|satisfied|grateful|thankful|blessed|positive|optimistic|hopeful|better|improved|improving|progress|success|achievement|accomplish|proud|confident|strong|resilient|calm|peaceful|relaxed|energetic|motivated|inspired|excited|enthusiastic|love|appreciate|care|support|connection|friendship|family|helpful|effective|working|beneficial/i;
  
  // Check for crisis indicators
  const crisisIndicators = /end(ing|s)?\s+(my|me|myself)|kill(ing|s)?\s+(my|me|myself)|suicide|self.?harm|hurt(ing|s)?\s+(my|me|myself)|die|death|overdose|take my life|no reason to live|better off without|ending me|feeling like ending/i;
  
  const hasNegative = negativePatterns.test(allAnswers);
  const hasPositive = positivePatterns.test(allAnswers);
  const hasCrisis = crisisIndicators.test(allAnswers);
  const hasStress = /stress|anxious|worried|difficult|challenging|hard|overwhelmed/.test(allAnswers);
  const hasSleep = /sleep|tired|rest|energy|fatigue/.test(allAnswers);
  const hasSocial = /friend|family|people|social|talk|support|interaction|colleague/.test(allAnswers);
  const hasCoping = /coping|strategy|technique|exercise|meditation|breathing|practice|help|support|therapy/.test(allAnswers);
  
  let summary = 'Based on your responses today: ';
  
  // Priority: Crisis situations
  if (hasCrisis || detectCrisisStrict(allAnswers)) {
    summary += 'You are experiencing significant distress and have expressed thoughts that concern me. ';
    summary += 'It is important to know that you are not alone and help is available. ';
    summary += 'Your willingness to share these feelings shows courage. ';
    summary += 'Immediate support: (1) Please reach out to a crisis hotline (988 Suicide & Crisis Lifeline, or text HOME to 741741), (2) Contact your healthcare provider or therapist immediately, (3) If you are in immediate danger, please call 911 or go to your nearest emergency room. ';
    summary += 'Your life has value, and there are people who want to help you through this difficult time. ';
  } 
  // Strong negative sentiment without explicit crisis
  else if (hasNegative && !hasPositive) {
    summary += 'You experienced significant challenges and distress today. ';
    summary += 'Your honesty in sharing these difficult feelings is important and shows self-awareness. ';
    summary += 'It is understandable to feel overwhelmed when facing multiple stressors. ';
    summary += 'Strengths: your ability to recognize and express difficult emotions, reaching out for support through this assessment. ';
    summary += 'Next steps: (1) Consider reaching out to your support network (family, friends, or a mental health professional), (2) Practice self-compassion and remember that difficult days do not define you, (3) If these feelings persist, please consult with a mental health professional who can provide appropriate support. ';
  }
  // Mixed day
  else if (hasNegative && hasPositive) {
    summary += 'You experienced a mixed day with both challenges and some positive moments. ';
    summary += 'Navigating difficult emotions while also recognizing positive aspects shows emotional awareness and resilience. ';
    summary += 'Strengths: balanced perspective, emotional awareness, ability to identify both challenges and positives. ';
    summary += 'Next steps: (1) Continue to acknowledge and process difficult feelings while also holding space for positive moments, (2) Consider using coping strategies that have helped in the past, (3) Maintain connections with your support network. ';
  }
  // Positive day
  else if (hasPositive && !hasNegative) {
    summary += 'You experienced a generally positive day with good emotional awareness. ';
    summary += 'Your ability to recognize positive moments and maintain balance shows strong self-awareness. ';
    summary += 'Strengths: positive outlook, emotional regulation, self-care practices. ';
    summary += 'Next steps: (1) Continue maintaining your current self-care routine, (2) Consider documenting what contributed to your positive mood today. ';
  }
  // Neutral or unclear
  else {
    summary += 'Thank you for completing this assessment. ';
    summary += 'Your responses help provide insight into your current state. ';
    summary += 'Strengths: willingness to engage in self-reflection and assessment. ';
    summary += 'Next steps: (1) Continue monitoring your mood and well-being, (2) Consider reaching out to support systems if needed, (3) Maintain regular self-care practices. ';
  }
  
  if (hasSleep && hasNegative) {
    summary += 'Sleep difficulties can significantly impact mood and well-being. Consider discussing sleep patterns with a healthcare provider. ';
  } else if (hasSleep) {
    summary += 'Your attention to sleep patterns is important for overall well-being. ';
  }
  
  if (hasSocial && !hasNegative) {
    summary += 'Your social connections appear to be a valuable source of support. ';
  } else if (hasSocial && hasNegative) {
    summary += 'Social connections can be an important source of support during difficult times. ';
  }
  
  if (hasCoping && hasNegative) {
    summary += 'Remember that coping strategies may take time to show effects. Be patient with yourself and consider trying different approaches if current strategies are not helping. ';
  }
  
  summary += 'I am an AI providing general emotional support, not a licensed therapist. If you need professional help, please consult with a mental health professional.';
  
  return summary;
}

async function sendRedAlertVoiceCall(phoneNumber, patientName) {
  if (!ENABLE_VOICE_CALLS || !twilioClient) {
    return { sent: false, reason: 'voice_calls_disabled' };
  }

  if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
    return { sent: false, reason: 'invalid_phone' };
  }

  // Format phone number (ensure it starts with +)
  let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  if (!formattedPhone.startsWith('+')) {
    // Assume US number if no country code
    formattedPhone = '+1' + formattedPhone;
  }

  // Use TwiML Bin URL if provided, otherwise use our endpoint with patient name
  // Note: For pre-recorded audio, patientName is still passed but may not be used if RED_ALERT_VOICE_AUDIO_URL is set
  // Auto-detect Vercel URL if API_URL is not set
  let baseUrl = process.env.API_URL;
  if (!baseUrl) {
    // Try to auto-detect Vercel URL
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.VERCEL) {
      // In Vercel, we can construct from request headers if available
      // But for now, fallback to requiring API_URL
      console.error('API_URL not set. Please set API_URL environment variable to your Vercel backend URL.');
      return { sent: false, reason: 'api_url_not_configured', error: 'API_URL environment variable is required' };
    } else {
      baseUrl = 'http://localhost:5000';
    }
  }
  
  // Ensure baseUrl has protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  const twimlUrl = process.env.TWIML_BIN_URL 
    ? process.env.TWIML_BIN_URL 
    : `${baseUrl}/api/ai-assessment/voice-message?patientName=${encodeURIComponent(patientName)}`;

  try {
    console.log('=== CREATING TWILIO CALL ===');
    console.log('To:', formattedPhone);
    console.log('From:', process.env.TWILIO_PHONE_NUMBER);
    console.log('TwiML URL:', twimlUrl);
    
    // Create a voice call with TwiML
    const call = await twilioClient.calls.create({
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: twimlUrl,
      method: 'GET',
      statusCallback: `${baseUrl}/api/ai-assessment/call-status`, // Track call status
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed'],
      statusCallbackMethod: 'POST'
    });
    
    console.log('Call created successfully');
    console.log('Call SID:', call.sid);
    console.log('Call Status:', call.status);
    
    return { sent: true, callSid: call.sid, status: call.status };
  } catch (e) {
    console.error('Twilio call creation error:', e);
    console.error('Error details:', {
      message: e.message,
      code: e.code,
      status: e.status,
      moreInfo: e.moreInfo
    });
    return { sent: false, reason: 'call_failed', error: String(e) };
  }
}

// TwiML endpoint for voice message
// Supports both pre-recorded audio and text-to-speech
router.get('/voice-message', (req, res) => {
  const patientName = req.query.patientName || 'a patient';
  
  // Debug logging - check if endpoint is being called by Twilio
  console.log('=== VOICE MESSAGE ENDPOINT CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', {
    'user-agent': req.headers['user-agent'],
    'x-twilio-signature': req.headers['x-twilio-signature'] ? 'Present' : 'Missing',
    'host': req.headers.host
  });
  console.log('Query params:', req.query);
  
  // Check if custom audio URL is configured
  let audioUrl = process.env.RED_ALERT_VOICE_AUDIO_URL;
  
  // Debug logging
  console.log('RED_ALERT_VOICE_AUDIO_URL exists:', !!audioUrl);
  if (audioUrl) {
    console.log('RED_ALERT_VOICE_AUDIO_URL value:', audioUrl.substring(0, 50) + '...');
  }
  
  // Convert GitHub blob URL to raw URL if needed
  if (audioUrl && audioUrl.includes('github.com') && audioUrl.includes('/blob/')) {
    audioUrl = audioUrl.replace('/blob/', '/').replace('github.com', 'raw.githubusercontent.com');
    console.log('Converted GitHub URL to raw URL:', audioUrl);
  }
  
  let twiml;
  
  if (audioUrl && audioUrl.trim()) {
    // Use pre-recorded audio file (MP3, WAV, etc.)
    // Audio file should be publicly accessible (hosted on CDN, S3, etc.)
    console.log('Using custom audio URL:', audioUrl);
    
    // Twilio Play tag - URL should be properly formatted
    // Don't double-encode - Twilio handles URL encoding internally
    // Use the raw URL, but escape XML special characters
    let safeUrl = audioUrl;
    // Only escape & for XML safety (but not if it's already part of a query string)
    safeUrl = safeUrl.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
    
    console.log('Safe audio URL:', safeUrl);
    console.log('URL length:', safeUrl.length);
    
    // Twilio sometimes has issues with certain URLs even if publicly accessible
    // Try multiple approaches:
    // 1. Direct Play (simplest)
    // 2. Play with digits attribute (for DTMF, not needed but sometimes helps)
    // 3. Wrap in Gather (sometimes more reliable)
    
    // First, try the simplest approach with explicit attributes
    // Add Pause to ensure call is established before playing
    // Remove loop attribute - default is 1, but sometimes explicit causes issues
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="2"/>
  <Play>${safeUrl}</Play>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
    
    console.log('Generated TwiML with Play tag');
    console.log('TwiML preview:', twiml.substring(0, 200));
  } else {
    console.log('RED_ALERT_VOICE_AUDIO_URL not set or empty, using text-to-speech');
    // Fallback to text-to-speech (can be customized for Bangladesh/Bengali)
    const voice = process.env.TWILIO_VOICE || 'alice'; // Options: alice, man, woman, polly.Aditi (for Bengali support)
    const language = process.env.TWILIO_LANGUAGE || 'en'; // Can be 'bn' for Bengali if using Polly
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">Hello, this is an urgent alert from MindTrack. ${patientName} has indicated they may be in crisis and needs immediate support. Please reach out to them as soon as possible. If this is an emergency, please call 999. Thank you.</Say>
  <Hangup/>
</Response>`;
  }
  
  console.log('Generated TwiML (first 300 chars):', twiml.substring(0, 300));
  console.log('Full TwiML:', twiml);
  
  // Set proper headers for TwiML
  res.type('text/xml');
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  console.log('Sending TwiML response');
  res.send(twiml);
});

// Debug endpoint to check environment variables and test TwiML
router.get('/voice-message-debug', (req, res) => {
  const audioUrl = process.env.RED_ALERT_VOICE_AUDIO_URL;
  let twiml = '';
  
  if (audioUrl && audioUrl.trim()) {
    // Use same logic as main endpoint
    let safeUrl = audioUrl;
    safeUrl = safeUrl.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
    
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Play loop="1">${safeUrl}</Play>
  <Hangup/>
</Response>`;
  }
  
  res.json({
    hasAudioUrl: !!audioUrl,
    audioUrl: audioUrl || 'NOT SET',
    audioUrlLength: audioUrl ? audioUrl.length : 0,
    allEnvVars: Object.keys(process.env).filter(k => k.includes('VOICE') || k.includes('TWILIO')),
    generatedTwiML: twiml || 'No TwiML generated (RED_ALERT_VOICE_AUDIO_URL not set)',
    fullTwiML: twiml
  });
});

// Test endpoint to return actual TwiML (same as voice-message but for testing)
router.get('/voice-message-test', (req, res) => {
  const audioUrl = process.env.RED_ALERT_VOICE_AUDIO_URL;
  
  if (!audioUrl || !audioUrl.trim()) {
    return res.status(400).json({ error: 'RED_ALERT_VOICE_AUDIO_URL not set' });
  }
  
  let safeUrl = audioUrl;
  safeUrl = safeUrl.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="2"/>
  <Play>${safeUrl}</Play>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
  
  res.type('text/xml');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(twiml);
});

// Test endpoint with Twilio's known working audio file (for comparison)
router.get('/voice-message-test-twilio', (req, res) => {
  console.log('=== TEST TWILIO ENDPOINT CALLED ===');
  console.log('Request headers:', {
    'user-agent': req.headers['user-agent'],
    'x-twilio-signature': req.headers['x-twilio-signature'] ? 'Present' : 'Missing'
  });
  
  // Use Twilio's test audio file to verify Play tag works
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Testing audio playback. You should hear a cowbell sound now.</Say>
  <Pause length="1"/>
  <Play>https://api.twilio.com/cowbell.mp3</Play>
  <Pause length="1"/>
  <Say>Audio test complete.</Say>
  <Hangup/>
</Response>`;
  
  console.log('Sending test TwiML:', twiml);
  res.type('text/xml');
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(twiml);
});

// Call status callback endpoint (for debugging) - MUST be POST and not protected
// Twilio sends form-encoded data, not JSON
// CRITICAL: Must return 200 OK quickly, or Twilio will retry and show warnings
router.post('/call-status', express.urlencoded({ extended: true }), (req, res) => {
  console.log('=== CALL STATUS CALLBACK ===');
  console.log('Request body keys:', Object.keys(req.body || {}));
  console.log('Call SID:', req.body?.CallSid || 'NOT FOUND');
  console.log('Call Status:', req.body?.CallStatus || 'NOT FOUND');
  console.log('Call Duration:', req.body?.CallDuration || 'NOT FOUND');
  console.log('Call Direction:', req.body?.Direction || 'NOT FOUND');
  console.log('From:', req.body?.From || 'NOT FOUND');
  console.log('To:', req.body?.To || 'NOT FOUND');
  
  // Return immediately to avoid Twilio warnings
  res.status(200).type('text/plain').send('OK');
  
  // Log after sending response (async)
  setTimeout(() => {
    console.log('All callback data:', req.body);
  }, 0);
});

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

async function sendRedAlertNotifications({ requester, summary, answers, extraContacts = [] }) {
  const results = {
    emails: { sent: false },
    voiceCalls: { sent: false, calls: [] }
  };

  // Send emails
  results.emails = await sendRedAlertEmails({ requester, summary, answers, extraContacts });

  // Send voice calls - collect unique phone numbers
  const phoneNumbers = [];
  const seenPhones = new Set();
  
  // Helper to add phone if not already seen
  const addPhoneIfNew = (phone, name, type, relationship = '') => {
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (normalizedPhone && !seenPhones.has(normalizedPhone)) {
      seenPhones.add(normalizedPhone);
      phoneNumbers.push({ phone, name, type, relationship });
    }
  };
  
  // Get doctor's phone number
  if (requester?.doctor) {
    const doctor = await User.findById(requester.doctor).select('phone name email');
    if (doctor?.phone) {
      addPhoneIfNew(doctor.phone, doctor.name || 'Doctor', 'doctor');
    }
  }

  // Get emergency contacts from user profile
  if (requester?.emergencyContacts && Array.isArray(requester.emergencyContacts)) {
    for (const contact of requester.emergencyContacts) {
      if (contact.phone) {
        addPhoneIfNew(
          contact.phone, 
          contact.name || 'Emergency Contact', 
          'emergency_contact',
          contact.relationship || ''
        );
      }
    }
  }

  // Make voice calls
  if (phoneNumbers.length > 0 && ENABLE_VOICE_CALLS && twilioClient) {
    for (const contact of phoneNumbers) {
      const callResult = await sendRedAlertVoiceCall(contact.phone, requester?.name || 'a patient');
      results.voiceCalls.calls.push({
        phone: contact.phone,
        name: contact.name,
        type: contact.type,
        ...callResult
      });
    }
    results.voiceCalls.sent = results.voiceCalls.calls.some(c => c.sent);
  } else if (phoneNumbers.length > 0) {
    results.voiceCalls.reason = ENABLE_VOICE_CALLS ? 'twilio_not_configured' : 'voice_calls_disabled';
  } else {
    results.voiceCalls.reason = 'no_phone_numbers';
  }

  return results;
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

    let notifications = { emails: { sent: false }, voiceCalls: { sent: false } };
    if (crisis) {
      // Fetch full user with emergency contacts
      const fullUser = await User.findById(req.user._id).select('emergencyContacts doctor phone');
      notifications = await sendRedAlertNotifications({ 
        requester: { ...req.user.toObject(), emergencyContacts: fullUser?.emergencyContacts, doctor: fullUser?.doctor }, 
        summary, 
        answers, 
        extraContacts: contacts || [] 
      });
    }

    res.json({ id: doc._id, summary, crisis, notifications, createdAt: doc.createdAt });
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


