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
    // Use gemini-pro (most stable and widely available model)
    geminiClient = genAI.getGenerativeModel({ model: 'gemini-pro' });
    useGemini = true;
    console.log('✅ Gemini AI initialized successfully for Assessment summaries (using gemini-pro)');
  } else {
    console.log('⚠️ GOOGLE_API_KEY not found in environment, Assessment will use hardcoded summaries');
  }
} catch (e) {
  console.error('❌ Failed to initialize Gemini AI for Assessment:', e.message);
  console.log('⚠️ Assessment will use hardcoded fallback summaries');
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
      secure: false, // true for 465, false for other ports
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    console.log('✅ Email transporter initialized successfully');
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP Port:', process.env.SMTP_PORT || 587);
    console.log('SMTP User:', process.env.SMTP_USER);
  } else {
    if (ENABLE_ALERT_EMAILS) {
      console.log('⚠️ Email alerts enabled but SMTP not fully configured');
      console.log('SMTP_HOST:', process.env.SMTP_HOST ? 'SET' : 'NOT SET');
      console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
      console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
    } else {
      console.log('ℹ️ Email alerts disabled (ENABLE_ALERT_EMAILS != "true")');
    }
  }
} catch (e) {
  console.error('❌ Failed to initialize email transporter:', e.message);
}

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

  // Generate two separate summaries
  let descriptiveSummary = '';
  let adviceSummary = '';

  // Prepare prompts outside try-catch so they're available in error handler
  const allAnswers = answers.join(' ').toLowerCase();
  // Define crisis indicators regex early so it can be used in hasCrisis calculation
  const crisisIndicatorsRegex = /end(ing|s)?\s+(my|me|myself)|kill(ing|s)?\s+(my|me|myself)|suicide|self.?harm|hurt(ing|s)?\s+(my|me|myself)|die|death|overdose|take my life|no reason to live|better off without|ending me|feeling like ending/i;
  const hasCrisis = crisisIndicatorsRegex.test(allAnswers) || detectCrisisStrict(allAnswers);
  
  const descriptivePrompt = `You are a mental health documentation assistant.
Create a clear, factual summary of the patient's responses to the assessment questions below.
This should be a document-style summary that describes what the patient reported, organized by topic.
Do NOT give advice, recommendations, or opinions. Just describe what the patient said.
Keep it concise (150-200 words) and objective.
\n\n${content}`;

  const advicePrompt = `You are a supportive, ethical mental-health assistant.
Based on the patient's responses below, provide:
1. A compassionate assessment of their current state
2. 2-3 identified strengths or supports
3. 2-3 concrete next steps or recommendations
${hasCrisis ? '4. CRITICAL: Include immediate crisis support resources (988 Suicide & Crisis Lifeline, Crisis Text Line 741741, 911)' : ''}
Use warm, empathetic language. Include a brief disclaimer that you are an AI assistant, not a licensed therapist.
Keep it around 150-200 words.
\n\n${content}`;

  if (useGemini && geminiClient) {
    try {
      console.log('🤖 Using Gemini AI to generate summaries...');
      
      // Generate descriptive summary (document-style)
      const descriptiveResult = await geminiClient.generateContent(descriptivePrompt);
      descriptiveSummary = descriptiveResult.response?.text?.() || descriptiveResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!descriptiveSummary || descriptiveSummary.trim().length === 0) {
        throw new Error('Empty response from Gemini for descriptive summary');
      }
      console.log('✅ Descriptive summary generated with Gemini AI');

      // Generate advice summary (with red alert if needed)
      const adviceResult = await geminiClient.generateContent(advicePrompt);
      adviceSummary = adviceResult.response?.text?.() || adviceResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!adviceSummary || adviceSummary.trim().length === 0) {
        throw new Error('Empty response from Gemini for advice summary');
      }
      console.log('✅ Advice summary generated with Gemini AI');

      // Return both summaries
      return { descriptiveSummary, adviceSummary };
    } catch (error) {
      console.error('❌ Gemini API error:', error.message);
      console.error('❌ Full error:', error);
      
      // If it's a model name error, try alternative models
      if (error.message && (error.message.includes('not found') || error.message.includes('404') || error.message.includes('models/'))) {
        console.log('🔄 Trying alternative Gemini model: gemini-1.5-pro');
        try {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
          const altClient = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
          
          // Retry with alternative model
          const descriptiveResult = await altClient.generateContent(descriptivePrompt);
          descriptiveSummary = descriptiveResult.response?.text?.() || descriptiveResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          const adviceResult = await altClient.generateContent(advicePrompt);
          adviceSummary = adviceResult.response?.text?.() || adviceResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (descriptiveSummary && adviceSummary) {
            console.log('✅ Summaries generated successfully with gemini-1.5-pro');
            // Update the global client for future use
            geminiClient = altClient;
            return { descriptiveSummary, adviceSummary };
          }
        } catch (altError) {
          console.error('❌ Alternative model also failed:', altError.message);
        }
      }
      
      console.log('⚠️ Falling back to hardcoded summaries');
      // fall through to local summarizer
    }
  } else {
    console.log('⚠️ Using hardcoded fallback summaries (Gemini not available)');
  }
  // Fallback summarizer - generate two summaries based on content
  // Note: allAnswers is already declared above (line 94), so we reuse it here
  
  // Generate descriptive summary (document-style)
  descriptiveSummary = 'Assessment Summary:\n\n';
  answers.forEach((answer, index) => {
    descriptiveSummary += `${QUESTIONS[index]}\n${answer}\n\n`;
  });
  descriptiveSummary += 'This assessment was completed on ' + new Date().toLocaleDateString() + '.';
  
  // Generate advice summary
  // Improved negative sentiment detection
  const negativePatterns = /bad|terrible|awful|horrible|worst|depressed|sad|down|low|hopeless|worthless|empty|numb|disappointed|frustrated|angry|upset|hurt|disrespected|not good|not too good|pretty bad|feeling bad|struggling|difficult|hard|challenging|overwhelmed|exhausted|drained|tired|fatigued|no energy|low energy|poor|worse|declining|worrying|concerned|anxious|stress|stressed|panic|fear|scared|afraid|lonely|isolated|alone|rejected|abandoned|betrayed|hurt|pain|suffering|distress|misery|sorrow|grief|despair|desperate|helpless|powerless|stuck|trapped|ending|suicide|self-harm|kill|die|death|worthless|burden|better off without|no point|no reason|give up|quit|nothing helps|nothing works|no hope|no future/i;
  
  // Positive sentiment detection
  const positivePatterns = /good|great|excellent|wonderful|amazing|fantastic|happy|joy|joyful|pleased|content|satisfied|grateful|thankful|blessed|positive|optimistic|hopeful|better|improved|improving|progress|success|achievement|accomplish|proud|confident|strong|resilient|calm|peaceful|relaxed|energetic|motivated|inspired|excited|enthusiastic|love|appreciate|care|support|connection|friendship|family|helpful|effective|working|beneficial/i;
  
  const hasNegative = negativePatterns.test(allAnswers);
  const hasPositive = positivePatterns.test(allAnswers);
  // Note: hasCrisis is already declared above (line 97), so we reuse it here
  const hasStress = /stress|anxious|worried|difficult|challenging|hard|overwhelmed/.test(allAnswers);
  const hasSleep = /sleep|tired|rest|energy|fatigue/.test(allAnswers);
  const hasSocial = /friend|family|people|social|talk|support|interaction|colleague/.test(allAnswers);
  const hasCoping = /coping|strategy|technique|exercise|meditation|breathing|practice|help|support|therapy/.test(allAnswers);
  
  adviceSummary = 'Based on your responses today: ';
  
  // Priority: Crisis situations
  if (hasCrisis) {
    adviceSummary += 'You are experiencing significant distress and have expressed thoughts that concern me. ';
    adviceSummary += 'It is important to know that you are not alone and help is available. ';
    adviceSummary += 'Your willingness to share these feelings shows courage. ';
    adviceSummary += '\n\n🚨 IMMEDIATE SUPPORT:\n';
    adviceSummary += '(1) 988 Suicide & Crisis Lifeline: Call or text 988\n';
    adviceSummary += '(2) Crisis Text Line: Text HOME to 741741\n';
    adviceSummary += '(3) Contact your healthcare provider or therapist immediately\n';
    adviceSummary += '(4) If you are in immediate danger, please call 911 or go to your nearest emergency room\n\n';
    adviceSummary += 'Your life has value, and there are people who want to help you through this difficult time. ';
  } 
  // Strong negative sentiment without explicit crisis
  else if (hasNegative && !hasPositive) {
    adviceSummary += 'You experienced significant challenges and distress today. ';
    adviceSummary += 'Your honesty in sharing these difficult feelings is important and shows self-awareness. ';
    adviceSummary += 'It is understandable to feel overwhelmed when facing multiple stressors. ';
    adviceSummary += '\n\nStrengths: your ability to recognize and express difficult emotions, reaching out for support through this assessment.\n\n';
    adviceSummary += 'Next steps:\n';
    adviceSummary += '(1) Consider reaching out to your support network (family, friends, or a mental health professional)\n';
    adviceSummary += '(2) Practice self-compassion and remember that difficult days do not define you\n';
    adviceSummary += '(3) If these feelings persist, please consult with a mental health professional who can provide appropriate support. ';
  }
  // Mixed day
  else if (hasNegative && hasPositive) {
    adviceSummary += 'You experienced a mixed day with both challenges and some positive moments. ';
    adviceSummary += 'Navigating difficult emotions while also recognizing positive aspects shows emotional awareness and resilience. ';
    adviceSummary += '\n\nStrengths: balanced perspective, emotional awareness, ability to identify both challenges and positives.\n\n';
    adviceSummary += 'Next steps:\n';
    adviceSummary += '(1) Continue to acknowledge and process difficult feelings while also holding space for positive moments\n';
    adviceSummary += '(2) Consider using coping strategies that have helped in the past\n';
    adviceSummary += '(3) Maintain connections with your support network. ';
  }
  // Positive day
  else if (hasPositive && !hasNegative) {
    adviceSummary += 'You experienced a generally positive day with good emotional awareness. ';
    adviceSummary += 'Your ability to recognize positive moments and maintain balance shows strong self-awareness. ';
    adviceSummary += '\n\nStrengths: positive outlook, emotional regulation, self-care practices.\n\n';
    adviceSummary += 'Next steps:\n';
    adviceSummary += '(1) Continue maintaining your current self-care routine\n';
    adviceSummary += '(2) Consider documenting what contributed to your positive mood today. ';
  }
  // Neutral or unclear
  else {
    adviceSummary += 'Thank you for completing this assessment. ';
    adviceSummary += 'Your responses help provide insight into your current state. ';
    adviceSummary += '\n\nStrengths: willingness to engage in self-reflection and assessment.\n\n';
    adviceSummary += 'Next steps:\n';
    adviceSummary += '(1) Continue monitoring your mood and well-being\n';
    adviceSummary += '(2) Consider reaching out to support systems if needed\n';
    adviceSummary += '(3) Maintain regular self-care practices. ';
  }
  
  if (hasSleep && hasNegative) {
    adviceSummary += '\n\nNote: Sleep difficulties can significantly impact mood and well-being. Consider discussing sleep patterns with a healthcare provider. ';
  } else if (hasSleep) {
    adviceSummary += '\n\nNote: Your attention to sleep patterns is important for overall well-being. ';
  }
  
  if (hasSocial && !hasNegative) {
    adviceSummary += '\n\nNote: Your social connections appear to be a valuable source of support. ';
  } else if (hasSocial && hasNegative) {
    adviceSummary += '\n\nNote: Social connections can be an important source of support during difficult times. ';
  }
  
  if (hasCoping && hasNegative) {
    adviceSummary += '\n\nNote: Remember that coping strategies may take time to show effects. Be patient with yourself and consider trying different approaches if current strategies are not helping. ';
  }
  
  adviceSummary += '\n\n*I am an AI providing general emotional support, not a licensed therapist. If you need professional help, please consult with a mental health professional.*';
  
  return { descriptiveSummary, adviceSummary };
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
    console.log('TWIML_BIN_URL set:', !!process.env.TWIML_BIN_URL);
    console.log('RED_ALERT_VOICE_AUDIO_URL set:', !!process.env.RED_ALERT_VOICE_AUDIO_URL);
    if (process.env.RED_ALERT_VOICE_AUDIO_URL) {
      console.log('Audio URL (first 100 chars):', process.env.RED_ALERT_VOICE_AUDIO_URL.substring(0, 100));
    }
    
    // Create a voice call with TwiML
    // CRITICAL: Twilio fetches TwiML when call is answered
    // The URL must be publicly accessible (no auth required)
    const call = await twilioClient.calls.create({
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: twimlUrl,
      method: 'GET',
      // Fix: Use valid status callback events only (removed 'failed' - not a valid event)
      statusCallback: `${baseUrl}/api/ai-assessment/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      timeout: 30
    });
    
    console.log('Call created successfully');
    console.log('Call SID:', call.sid);
    console.log('Call Status:', call.status);
    console.log('IMPORTANT: Check Twilio Console → Monitor → Logs → Calls → [Call SID] for TwiML execution details');
    
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
// CRITICAL: This endpoint MUST be publicly accessible (no auth) for Twilio to call it
router.get('/voice-message', (req, res) => {
  const patientName = req.query.patientName || 'a patient';
  
  // EXTENSIVE Debug logging - check if endpoint is being called by Twilio
  console.log('=== VOICE MESSAGE ENDPOINT CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request path:', req.path);
  console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('Request headers:', {
    'user-agent': req.headers['user-agent'],
    'x-twilio-signature': req.headers['x-twilio-signature'] ? 'Present' : 'Missing',
    'host': req.headers.host,
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-forwarded-proto': req.headers['x-forwarded-proto']
  });
  console.log('Query params:', req.query);
  console.log('IP Address:', req.ip || req.connection.remoteAddress);
  
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
    
    // Simplified TwiML - removed Pause tags as they can sometimes cause issues
    // Twilio will automatically wait for call to be established before playing
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${safeUrl}</Play>
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
  
  console.log('Final TwiML length:', twiml.length);
  console.log('Final TwiML:', twiml);
  
  // Set proper headers for TwiML
  res.type('text/xml');
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  console.log('Sending TwiML response (status 200)');
  console.log('Response headers set:', {
    'Content-Type': res.get('Content-Type'),
    'Cache-Control': res.get('Cache-Control')
  });
  
  res.send(twiml);
  console.log('TwiML response sent successfully');
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

// Test email endpoint - sends a test email to verify SMTP configuration
router.post('/test-email', protect, async (req, res) => {
  if (!ENABLE_ALERT_EMAILS) {
    return res.status(400).json({ 
      error: 'Email alerts are disabled',
      message: 'Set ENABLE_ALERT_EMAILS=true to enable email alerts'
    });
  }

  if (!transporter) {
    return res.status(400).json({ 
      error: 'Email transporter not initialized',
      message: 'Check SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS)',
      config: {
        SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
        SMTP_USER: process.env.SMTP_USER || 'NOT SET',
        SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
        SMTP_PORT: process.env.SMTP_PORT || '587 (default)'
      }
    });
  }

  const { testEmail } = req.body;
  if (!testEmail || !/@/.test(testEmail)) {
    return res.status(400).json({ 
      error: 'Invalid email address',
      message: 'Please provide a valid test email address'
    });
  }

  try {
    console.log('=== TEST EMAIL SENDING ===');
    console.log('To:', testEmail);
    console.log('From:', process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER);
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP User:', process.env.SMTP_USER);
    console.log('SMTP Pass length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);
    console.log('SMTP Pass first char:', process.env.SMTP_PASS ? process.env.SMTP_PASS[0] : 'N/A');
    console.log('SMTP Pass last char:', process.env.SMTP_PASS ? process.env.SMTP_PASS[process.env.SMTP_PASS.length - 1] : 'N/A');

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: '🧪 MindTrack Email Test',
      text: `This is a test email from MindTrack.

If you received this email, your SMTP configuration is working correctly!

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT || 587}
- From: ${process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER}

Time: ${new Date().toISOString()}
`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', info.messageId);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      to: testEmail
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response);
    console.error('Error command:', error.command);

    let errorMessage = 'Failed to send test email';
    let suggestions = [];

    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed';
      suggestions = [
        'Make sure you are using an App Password (not your regular Gmail password)',
        'Verify 2-factor authentication is enabled on your Gmail account',
        'Generate a new App Password at https://myaccount.google.com/apppasswords',
        'Check that SMTP_USER matches the Gmail account used to generate the App Password',
        'Make sure there are no extra spaces or characters in SMTP_PASS',
        'If you updated Vercel environment variables, make sure you redeployed the application'
      ];
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server';
      suggestions = [
        'Check your internet connection',
        'Verify SMTP_HOST is correct (smtp.gmail.com)',
        'Check if port 587 is blocked by firewall'
      ];
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: {
        code: error.code,
        message: error.message,
        response: error.response,
        command: error.command
      },
      suggestions,
      troubleshooting: {
        smtpHost: process.env.SMTP_HOST,
        smtpUser: process.env.SMTP_USER,
        smtpPassSet: !!process.env.SMTP_PASS,
        smtpPassLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
      }
    });
  }
});

// Diagnostic endpoint to check Twilio and Email configuration
router.get('/twilio-config-check', protect, (req, res) => {
  const config = {
    enableVoiceCalls: ENABLE_VOICE_CALLS,
    twilioClientInitialized: !!twilioClient,
    enableAlertEmails: ENABLE_ALERT_EMAILS,
    transporterInitialized: !!transporter,
    environmentVariables: {
      ENABLE_VOICE_CALLS: process.env.ENABLE_VOICE_CALLS || 'NOT SET',
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'SET (hidden)' : 'NOT SET',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'SET (hidden)' : 'NOT SET',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || 'NOT SET',
      API_URL: process.env.API_URL || 'NOT SET',
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      RED_ALERT_VOICE_AUDIO_URL: process.env.RED_ALERT_VOICE_AUDIO_URL ? 'SET' : 'NOT SET',
      TWIML_BIN_URL: process.env.TWIML_BIN_URL ? 'SET' : 'NOT SET',
      ENABLE_ALERT_EMAILS: process.env.ENABLE_ALERT_EMAILS || 'NOT SET',
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET (hidden)' : 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
      MAIL_FROM: process.env.MAIL_FROM || process.env.SMTP_FROM || 'NOT SET'
    },
    issues: []
  };

  // Check for issues
  if (!ENABLE_VOICE_CALLS) {
    config.issues.push('ENABLE_VOICE_CALLS is not set to "true"');
  }
  if (!process.env.TWILIO_ACCOUNT_SID) {
    config.issues.push('TWILIO_ACCOUNT_SID is not set');
  }
  if (!process.env.TWILIO_AUTH_TOKEN) {
    config.issues.push('TWILIO_AUTH_TOKEN is not set');
  }
  if (!process.env.TWILIO_PHONE_NUMBER) {
    config.issues.push('TWILIO_PHONE_NUMBER is not set');
  }
  if (!twilioClient) {
    config.issues.push('Twilio client is not initialized (check credentials)');
  }
  if (!process.env.API_URL && !process.env.VERCEL_URL) {
    config.issues.push('API_URL is not set (needed for TwiML endpoint)');
  }
  
  // Email configuration issues
  if (!ENABLE_ALERT_EMAILS) {
    config.issues.push('ENABLE_ALERT_EMAILS is not set to "true"');
  }
  if (!process.env.SMTP_HOST) {
    config.issues.push('SMTP_HOST is not set (required for email alerts)');
  }
  if (!process.env.SMTP_USER) {
    config.issues.push('SMTP_USER is not set (required for email alerts)');
  }
  if (!process.env.SMTP_PASS) {
    config.issues.push('SMTP_PASS is not set (required for email alerts)');
  }
  if (!transporter) {
    config.issues.push('Email transporter is not initialized (check SMTP configuration)');
  }

  // Check user's phone numbers and email addresses
  User.findById(req.user._id).select('emergencyContacts doctor phone email').then(user => {
    const phoneNumbers = [];
    const emailAddresses = [];
    
    // Check doctor
    if (user?.doctor) {
      User.findById(user.doctor).select('phone name email').then(doctor => {
        if (doctor?.phone) {
          phoneNumbers.push({ phone: doctor.phone, name: doctor.name || 'Doctor', type: 'doctor' });
        }
        if (doctor?.email) {
          emailAddresses.push({ email: doctor.email, name: doctor.name || 'Doctor', type: 'doctor' });
        }
        
        // Check emergency contacts
        if (user?.emergencyContacts && Array.isArray(user.emergencyContacts)) {
          user.emergencyContacts.forEach(contact => {
            if (contact.phone) {
              phoneNumbers.push({ 
                phone: contact.phone, 
                name: contact.name || 'Emergency Contact', 
                type: 'emergency_contact' 
              });
            }
            if (contact.email && /@/.test(contact.email)) {
              emailAddresses.push({ 
                email: contact.email, 
                name: contact.name || 'Emergency Contact', 
                type: 'emergency_contact',
                relationship: contact.relationship || ''
              });
            }
          });
        }
        
        config.userPhoneNumbers = phoneNumbers;
        config.phoneNumberCount = phoneNumbers.length;
        config.userEmailAddresses = emailAddresses;
        config.emailAddressCount = emailAddresses.length;
        
        if (phoneNumbers.length === 0) {
          config.issues.push('No phone numbers found (no doctor phone or emergency contacts)');
        }
        if (emailAddresses.length === 0) {
          config.issues.push('No email addresses found (no doctor email or emergency contact emails)');
        }
        
        res.json(config);
      }).catch(() => {
        config.userPhoneNumbers = phoneNumbers;
        config.userEmailAddresses = emailAddresses;
        res.json(config);
      });
    } else {
      // No doctor assigned
      if (user?.emergencyContacts && Array.isArray(user.emergencyContacts)) {
        user.emergencyContacts.forEach(contact => {
          if (contact.phone) {
            phoneNumbers.push({ 
              phone: contact.phone, 
              name: contact.name || 'Emergency Contact', 
              type: 'emergency_contact' 
            });
          }
          if (contact.email && /@/.test(contact.email)) {
            emailAddresses.push({ 
              email: contact.email, 
              name: contact.name || 'Emergency Contact', 
              type: 'emergency_contact',
              relationship: contact.relationship || ''
            });
          }
        });
      }
      config.userPhoneNumbers = phoneNumbers;
      config.phoneNumberCount = phoneNumbers.length;
      config.userEmailAddresses = emailAddresses;
      config.emailAddressCount = emailAddresses.length;
      
      if (phoneNumbers.length === 0) {
        config.issues.push('No phone numbers found (no doctor phone or emergency contacts)');
      }
      if (emailAddresses.length === 0) {
        config.issues.push('No email addresses found (no doctor email or emergency contact emails)');
      }
      
      res.json(config);
    }
  }).catch(err => {
    config.error = 'Failed to fetch user data: ' + err.message;
    res.json(config);
  });
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
  const emailDetails = []; // Track who we're sending to for logging

  // Patient's doctor (if linked)
  if (requester?.doctor) {
    const doctor = await User.findById(requester.doctor).select('email name');
    if (doctor?.email) {
      recipients.add(doctor.email);
      emailDetails.push({ email: doctor.email, name: doctor.name || 'Doctor', type: 'doctor' });
    }
  }

  // Emergency contacts with email addresses
  if (requester?.emergencyContacts && Array.isArray(requester.emergencyContacts)) {
    for (const contact of requester.emergencyContacts) {
      if (contact.email && /@/.test(contact.email)) {
        recipients.add(contact.email);
        emailDetails.push({ 
          email: contact.email, 
          name: contact.name || 'Emergency Contact', 
          type: 'emergency_contact',
          relationship: contact.relationship || ''
        });
      }
    }
  }

  // Optional extra contacts from request
  for (const e of extraContacts) {
    if (e && /@/.test(e)) {
      recipients.add(e);
      emailDetails.push({ email: e, name: 'Extra Contact', type: 'extra' });
    }
  }

  if (recipients.size === 0) {
    console.log('No email recipients found for red alert');
    return { sent: false, reason: 'no_recipients' };
  }

  const patientName = requester?.name || 'a patient';
  const patientEmail = requester?.email || 'N/A';

  // Create email content
  const emailSubject = `🚨 MindTrack Red Alert: ${patientName} Needs Immediate Attention`;
  const emailText = `RED ALERT - IMMEDIATE ATTENTION REQUIRED

A potential crisis has been detected for ${patientName} (${patientEmail}).

This is an automated alert from the MindTrack mental health monitoring system.

PATIENT INFORMATION:
Name: ${patientName}
Email: ${patientEmail}

CRISIS SUMMARY:
${summary || 'A crisis situation has been detected based on patient responses.'}

RECENT ASSESSMENT RESPONSES:
${answers.map((a, i) => `Q${i + 1}: ${QUESTIONS[i]}\nA${i + 1}: ${a}`).join('\n\n')}

ACTION REQUIRED:
Please reach out to ${patientName} immediately to provide support and assess their safety.

If this is a life-threatening emergency, please contact emergency services immediately:
- Emergency Services: 911 (US) or your local emergency number
- Crisis Text Line: Text HOME to 741741 (US/Canada/UK)
- 988 Suicide & Crisis Lifeline: Call or text 988 (US)

This alert has been sent to:
${emailDetails.map(e => `- ${e.name}${e.type === 'doctor' ? ' (Doctor)' : e.type === 'emergency_contact' ? ` (${e.relationship || 'Emergency Contact'})` : ''}: ${e.email}`).join('\n')}

---
This is an automated message from MindTrack. Please do not reply to this email.`;

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER,
    to: Array.from(recipients).join(','),
    subject: emailSubject,
    text: emailText
  };

  try {
    console.log('=== SENDING RED ALERT EMAILS ===');
    console.log('Recipients:', Array.from(recipients));
    console.log('Email details:', emailDetails);
    console.log('SMTP Configuration:');
    console.log('  Host:', process.env.SMTP_HOST);
    console.log('  Port:', process.env.SMTP_PORT || 587);
    console.log('  User:', process.env.SMTP_USER);
    console.log('  Pass length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);
    console.log('  From:', mailOptions.from);
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Red alert emails sent successfully');
    return { sent: true, recipients: Array.from(recipients), count: recipients.size };
  } catch (e) {
    console.error('❌ Failed to send red alert emails:', e);
    console.error('Error code:', e.code);
    console.error('Error response:', e.response);
    console.error('Error command:', e.command);
    
    let errorDetails = String(e);
    if (e.code === 'EAUTH') {
      errorDetails += '\n\nTROUBLESHOOTING:\n';
      errorDetails += '1. Make sure you are using an App Password (not regular Gmail password)\n';
      errorDetails += '2. Generate App Password at: https://myaccount.google.com/apppasswords\n';
      errorDetails += '3. Verify 2-factor authentication is enabled\n';
      errorDetails += '4. Check that SMTP_USER matches the Gmail account\n';
      errorDetails += '5. If using Vercel, make sure you REDEPLOYED after updating environment variables';
    }
    
    return { sent: false, reason: 'send_failed', error: errorDetails, code: e.code };
  }
}

async function sendRedAlertNotifications({ requester, summary, answers, extraContacts = [] }) {
  const results = {
    emails: { sent: false },
    voiceCalls: { sent: false, calls: [] }
  };

  console.log('=== RED ALERT NOTIFICATIONS START ===');
  console.log('ENABLE_VOICE_CALLS:', ENABLE_VOICE_CALLS);
  console.log('twilioClient initialized:', !!twilioClient);
  console.log('TWILIO_ACCOUNT_SID set:', !!process.env.TWILIO_ACCOUNT_SID);
  console.log('TWILIO_AUTH_TOKEN set:', !!process.env.TWILIO_AUTH_TOKEN);
  console.log('TWILIO_PHONE_NUMBER set:', !!process.env.TWILIO_PHONE_NUMBER);
  console.log('API_URL set:', !!process.env.API_URL);
  console.log('API_URL value:', process.env.API_URL || 'NOT SET');
  console.log('--- EMAIL CONFIGURATION ---');
  console.log('ENABLE_ALERT_EMAILS:', ENABLE_ALERT_EMAILS);
  console.log('transporter initialized:', !!transporter);
  console.log('SMTP_HOST set:', !!process.env.SMTP_HOST);
  console.log('SMTP_USER set:', !!process.env.SMTP_USER);
  console.log('SMTP_PASS set:', !!process.env.SMTP_PASS);
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');

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
      console.log(`Added phone number: ${phone} (${name}, ${type})`);
    }
  };
  
  // Get doctor's phone number
  if (requester?.doctor) {
    console.log('Checking doctor phone, doctor ID:', requester.doctor);
    const doctor = await User.findById(requester.doctor).select('phone name email');
    if (doctor?.phone) {
      console.log('Doctor phone found:', doctor.phone);
      addPhoneIfNew(doctor.phone, doctor.name || 'Doctor', 'doctor');
    } else {
      console.log('Doctor phone NOT found or empty');
    }
  } else {
    console.log('No doctor assigned to user');
  }

  // Get emergency contacts from user profile
  console.log('Emergency contacts:', requester?.emergencyContacts);
  if (requester?.emergencyContacts && Array.isArray(requester.emergencyContacts)) {
    for (const contact of requester.emergencyContacts) {
      if (contact.phone) {
        addPhoneIfNew(
          contact.phone, 
          contact.name || 'Emergency Contact', 
          'emergency_contact',
          contact.relationship || ''
        );
      } else {
        console.log('Emergency contact missing phone:', contact.name || 'Unknown');
      }
    }
  } else {
    console.log('No emergency contacts found');
  }

  console.log(`Total phone numbers collected: ${phoneNumbers.length}`);
  console.log('Phone numbers:', phoneNumbers.map(p => ({ phone: p.phone, name: p.name })));

  // Make voice calls
  if (phoneNumbers.length > 0 && ENABLE_VOICE_CALLS && twilioClient) {
    console.log('Attempting to make voice calls...');
    for (const contact of phoneNumbers) {
      const callResult = await sendRedAlertVoiceCall(contact.phone, requester?.name || 'a patient');
      console.log(`Call result for ${contact.phone}:`, callResult);
      results.voiceCalls.calls.push({
        phone: contact.phone,
        name: contact.name,
        type: contact.type,
        ...callResult
      });
    }
    results.voiceCalls.sent = results.voiceCalls.calls.some(c => c.sent);
  } else {
    if (phoneNumbers.length === 0) {
      console.log('❌ No phone numbers found - cannot make calls');
      results.voiceCalls.reason = 'no_phone_numbers';
    } else if (!ENABLE_VOICE_CALLS) {
      console.log('❌ Voice calls disabled (ENABLE_VOICE_CALLS != "true")');
      results.voiceCalls.reason = 'voice_calls_disabled';
    } else if (!twilioClient) {
      console.log('❌ Twilio client not initialized - check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
      results.voiceCalls.reason = 'twilio_not_configured';
      results.voiceCalls.details = {
        hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER
      };
    }
  }

  console.log('=== RED ALERT NOTIFICATIONS END ===');
  console.log('Final results:', JSON.stringify(results, null, 2));

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
    const summaries = await summarizeAnswers(answers);
    
    // Extract summaries (handle both old format and new format)
    const descriptiveSummary = summaries.descriptiveSummary || summaries.summary || '';
    const adviceSummary = summaries.adviceSummary || summaries.summary || '';
    const legacySummary = summaries.summary || (descriptiveSummary + '\n\n' + adviceSummary);

    // Persist assessment
    const doc = await Assessment.create({
      user: req.user._id,
      answers,
      summary: legacySummary, // Keep for backward compatibility
      descriptiveSummary,
      adviceSummary,
      crisis
    });

    let notifications = { emails: { sent: false }, voiceCalls: { sent: false } };
    if (crisis) {
      // Fetch full user with emergency contacts
      const fullUser = await User.findById(req.user._id).select('emergencyContacts doctor phone');
      notifications = await sendRedAlertNotifications({ 
        requester: { ...req.user.toObject(), emergencyContacts: fullUser?.emergencyContacts, doctor: fullUser?.doctor }, 
        summary: adviceSummary, // Use advice summary for notifications
        answers, 
        extraContacts: contacts || [] 
      });
    }

    res.json({ 
      id: doc._id, 
      summary: legacySummary, // Backward compatibility
      descriptiveSummary,
      adviceSummary,
      crisis, 
      notifications, 
      createdAt: doc.createdAt 
    });
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


