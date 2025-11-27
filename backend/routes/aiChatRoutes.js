const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Store conversation history (in production, use Redis or database)
const conversations = new Map();

// Get or create conversation for user
function getConversation(userId) {
  if (!conversations.has(userId)) {
    conversations.set(userId, [
      {
        role: 'system',
        content: `You are a compassionate mental health support AI assistant providing general emotional support through ChatGPT.

⚠️ CRITICAL ETHICAL RESTRICTIONS (YOU MUST FOLLOW THESE):

1. **AI DISCLOSURE**: You MUST state clearly that you are an AI assistant, NOT a human therapist, NOT a medical professional. Include this in responses when appropriate.

2. **NOT A REPLACEMENT**: You are NOT a replacement for professional therapy, medical care, or licensed mental health services. Always encourage professional help for severe or persistent issues.

3. **GENERAL SUPPORT ONLY**: You provide general emotional support and coping strategies. You do NOT diagnose, treat, prescribe, or provide medical advice.

4. **CRISIS RESPONSE**: If user mentions suicide, self-harm, ending their life, wanting to die - IMMEDIATELY provide emergency resources:
   - Crisis Text Line: Text HOME to 741741 (US/Canada/UK)
   - 988 Suicide & Crisis Lifeline: Call or text 988 (US)
   - Emergency Services: 911 or local emergency number
   - International resources when appropriate
   DO NOT provide methods for self-harm. Always prioritize safety.

5. **PRIVACY PROTECTION**: You do NOT store sensitive data beyond the conversation context. Protect user privacy.

6. **EVIDENCE-BASED**: Use only evidence-based mental health information and established coping strategies.

7. **NO BIAS OR JUDGMENT**: Be non-judgmental, culturally sensitive, and free from bias. Accept all feelings as valid.

8. **PROFESSIONAL REFERRAL**: Always recommend professional help (therapists, counselors, psychiatrists) for:
   - Severe depression
   - Persistent anxiety
   - Thoughts of self-harm
   - Any crisis situation
   - When user asks about therapy

RESPONSE GUIDELINES:
- Warm, empathetic, compassionate, non-judgmental tone
- Keep responses around 150-200 words (concise but helpful)
- Provide VARIED responses - don't repeat the same answers
- Use active listening techniques (reflect, validate, explore)
- Focus on: coping strategies, emotional support, practical techniques
- Be conversational but professional
- Provide specific, actionable advice when possible

POSITIVE DISTRACTIONS:
- If user asks about movies, books, activities - provide thoughtful suggestions
- Use these as healthy coping mechanisms when appropriate

REMEMBER:
- You are ChatGPT (GPT-3.5-turbo), an AI assistant
- Support, guide, validate, and refer - NEVER diagnose or treat
- Safety and user well-being are the top priority
- Always provide crisis resources when needed
- Vary your responses to avoid repetition`
      }
    ]);
  }
  return conversations.get(userId);
}

// Enhanced crisis detection function with typo tolerance
function detectCrisis(message) {
  const messageLower = message.toLowerCase().trim();
  
  // Primary crisis phrases (exact matches)
  const crisisPhrases = [
    'end me', 'end myself', 'ending me', 'ending myself', 'end my life',
    'kill myself', 'kill me', 'killing myself', 'suicide', 'commit suicide',
    'take my life', 'take my own life', 'hurt myself', 'self harm', 'self-harm',
    'not good for this world', 'should end', 'want to die', 'wanting to die',
    'no point living', 'no point in living', 'overdose', 'cutting', 'self injury',
    'die', 'end it all', 'end it', 'not worth living', 'better off dead',
    'dont want to live', 'dont wanna live', 'dont want to be here'
  ];
  
  // Individual crisis words (check if multiple appear together)
  const crisisWords = [
    'end', 'ending', 'kill', 'suicide', 'die', 'dead', 'death',
    'harm', 'hurt', 'cut', 'overdose', 'self', 'myself'
  ];
  
  // Check for exact phrase matches
  if (crisisPhrases.some(phrase => messageLower.includes(phrase))) {
    return true;
  }
  
  // Check for combination of crisis words (more flexible detection)
  const wordsInMessage = messageLower.split(/\s+/);
  const foundCrisisWords = crisisWords.filter(word => {
    // Check both whole word and substring matches to catch typos
    return wordsInMessage.some(msgWord => 
      msgWord.includes(word) || word.includes(msgWord) ||
      msgWord.startsWith(word) || word.startsWith(msgWord.substring(0, 3))
    );
  });
  
  // If multiple crisis words found, likely a crisis message
  if (foundCrisisWords.length >= 2) {
    return true;
  }
  
  // Check for "ending" + "me/myself/my life"
  if (messageLower.includes('ending') && (
    messageLower.includes('me') || 
    messageLower.includes('myself') || 
    messageLower.includes('my life') ||
    messageLower.includes('it all')
  )) {
    return true;
  }
  
  // Check for "feel like" + crisis words
  if ((messageLower.includes('feel') || messageLower.includes('feeling') || messageLower.includes('filling')) && 
      (messageLower.includes('end') || messageLower.includes('die') || messageLower.includes('kill'))) {
    return true;
  }
  
  // Check for "want to" + crisis words
  if ((messageLower.includes('want to') || messageLower.includes('wanna') || messageLower.includes('wanna')) &&
      (messageLower.includes('end') || messageLower.includes('die') || messageLower.includes('kill'))) {
    return true;
  }
  
  return false;
}

// Store crisis flags for users (in production, use database)
const crisisFlags = new Map();

// Send message to AI
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const userId = req.user.id;
    const userMessage = message.trim();
    
    // CRISIS DETECTION - Check for suicidal ideation or self-harm
    const isCrisis = detectCrisis(userMessage);
    console.log(`🔍 Crisis detection check for message: "${userMessage}" - Result: ${isCrisis}`);
    
    if (isCrisis) {
      // Flag this user as in crisis
      crisisFlags.set(userId, {
        flagged: true,
        timestamp: new Date().toISOString(),
        message: userMessage,
        severity: 'high'
      });
      
      // Log crisis for monitoring (in production, save to database and trigger alerts)
      console.warn(`🚨 CRISIS DETECTED - User ID: ${userId}, Message: ${userMessage}`);
      
      const crisisResponse = {
        message: `🚨 **CRISIS SUPPORT**\n\nI'm concerned about what you're sharing. Please know that you matter and there is help available right now.\n\n**IMMEDIATE HELP:**\n• **Crisis Text Line**: Text HOME to 741741 (US/Canada/UK)\n• **988 Suicide & Crisis Lifeline**: Call or text 988 (US)\n• **Emergency Services**: 911 (US) or your local emergency number\n• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/\n\n**IMPORTANT:** This conversation may be shared with your emergency contacts and healthcare providers to ensure your safety.\n\n**You are not alone.** Professional help is available 24/7. Please reach out to someone who can help right now.\n\n---\n*I am an AI assistant providing general emotional support, not a licensed therapist or medical professional.*`,
        timestamp: new Date().toISOString(),
        crisisFlag: true,
        requiresNotification: true // Flag for frontend to trigger notifications
      };
      
      return res.json(crisisResponse);
    }

    const conversation = getConversation(userId);
    
    // Add user message to conversation
    conversation.push({
      role: 'user',
      content: userMessage
    });

    let aiResponse;
    let requiresNotification = false;

    // PRIORITY: Try ChatGPT first if available
    if (openai) {
      try {
        // Call OpenAI API with enhanced safety system prompt
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: conversation,
          max_tokens: 250, // Allow slightly more for detailed responses
          temperature: 0.7,
          presence_penalty: 0.6, // Encourage varied responses
        });

        aiResponse = completion.choices[0].message.content;
        
        // Safety check: Verify response doesn't contain harmful content
        const harmfulPatterns = [
          /how to (kill|end|harm)/i,
          /method(s)? to (die|suicide|self.?harm)/i,
          /step.?by.?step.*(suicide|kill)/i
        ];
        
        const containsHarmful = harmfulPatterns.some(pattern => pattern.test(aiResponse));
        
        if (containsHarmful) {
          // If response contains harmful content, override with safe response
          console.warn('⚠️ Harmful content detected in AI response, overriding');
          aiResponse = "I understand you're going through a difficult time. Your safety is the most important thing right now.\n\n**IMMEDIATE HELP:**\n• Crisis Text Line: Text HOME to 741741\n• 988 Suicide & Crisis Lifeline: Call or text 988\n• Emergency Services: 911\n• Your local emergency number\n\n**You are not alone.** Professional help is available 24/7. Please reach out to someone who can provide the support you need right now.\n\n*I am an AI assistant providing general emotional support, not a licensed therapist or medical professional.*";
        } else {
          // Ensure AI response includes ethical disclaimer if not present (check every few responses)
          const shouldAddDisclaimer = Math.random() < 0.3; // Add disclaimer ~30% of the time
          if (shouldAddDisclaimer && !aiResponse.includes('AI assistant') && !aiResponse.includes('not a therapist')) {
            aiResponse += '\n\n*I am an AI assistant providing general emotional support, not a licensed therapist or medical professional.*';
          }
        }
      } catch (openaiError) {
        console.log('OpenAI error, falling back to smart AI:', openaiError.message);
        // Fall back to smart AI responses when ChatGPT fails
        const smartResponse = generateSmartAIResponse(userMessage, conversation);
        aiResponse = smartResponse.response;
        requiresNotification = smartResponse.requiresNotification || false;
      }
    } else {
      // OpenAI not configured - use smart AI responses as fallback
      const smartResponse = generateSmartAIResponse(userMessage, conversation);
      aiResponse = smartResponse.response;
      requiresNotification = smartResponse.requiresNotification || false;
    }
    
    // Add AI response to conversation
    conversation.push({
      role: 'assistant',
      content: aiResponse
    });

    // Keep conversation history manageable (last 20 messages)
    if (conversation.length > 20) {
      conversation.splice(1, conversation.length - 20);
    }

    res.json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
      requiresNotification: requiresNotification
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      message: 'AI service is currently unavailable. Please try again later.' 
    });
  }
});

// Get crisis flag status
router.get('/crisis-status', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const crisisStatus = crisisFlags.get(userId);
    
    res.json({
      inCrisis: crisisStatus ? crisisStatus.flagged : false,
      timestamp: crisisStatus ? crisisStatus.timestamp : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check crisis status' });
  }
});

// Smart AI Response Generator with variety, ethical compliance, and positive distractions
function generateSmartAIResponse(userMessage, conversation) {
  const message = userMessage.toLowerCase();
  let response = '';
  let requiresNotification = false;
  
  // Movie suggestions - positive distraction
  const movieSuggestions = {
    uplifting: ['The Pursuit of Happyness', 'Good Will Hunting', 'Inside Out', 'The Secret Life of Walter Mitty', 'Amélie', 'Up', 'The Shawshank Redemption'],
    inspiring: ['Forrest Gump', 'The Blind Side', 'A Beautiful Mind', 'Life is Beautiful', 'The Theory of Everything'],
    comforting: ['The Princess Bride', 'Studio Ghibli films', 'Paddington', 'The Grand Budapest Hotel', 'Little Miss Sunshine'],
    thoughtProvoking: ['Eternal Sunshine of the Spotless Mind', 'Her', 'Lost in Translation', '500 Days of Summer']
  };
  
  // Random selection for variety
  const getRandomMovie = (category) => {
    const movies = movieSuggestions[category] || movieSuggestions.comforting;
    return movies[Math.floor(Math.random() * movies.length)];
  };
  
  // Check conversation context
  const recentMessages = conversation.slice(-4);
  const hasRecentDepression = recentMessages.some(msg => 
    msg.content.toLowerCase().includes('sad') || 
    msg.content.toLowerCase().includes('depressed') ||
    msg.content.toLowerCase().includes('not feeling well') ||
    msg.content.toLowerCase().includes('not well') ||
    msg.content.toLowerCase().includes('down')
  );
  
  const hasRecentAnxiety = recentMessages.some(msg => 
    msg.content.toLowerCase().includes('anxious') || 
    msg.content.toLowerCase().includes('anxiety') ||
    msg.content.toLowerCase().includes('worried')
  );
  
  // MOVIE SUGGESTIONS - Positive distraction
  if (message.includes('movie') || message.includes('movies') || message.includes('film') || message.includes('suggest') || message.includes('recommend')) {
    if (message.includes('uplifting') || message.includes('happy')) {
      response = `Here are some uplifting movies that might lift your spirits:\n\n🍿 **Recommendations:**\n• ${getRandomMovie('uplifting')}\n• ${getRandomMovie('uplifting')}\n• ${getRandomMovie('uplifting')}\n\nSometimes a good film can provide a welcome break and help shift your perspective. Would you like suggestions for other genres?`;
    } else if (hasRecentDepression) {
      response = `I'd love to suggest some comforting films that might help:\n\n🍿 **Comfort Movies:**\n• ${getRandomMovie('comforting')}\n• ${getRandomMovie('uplifting')}\n• ${getRandomMovie('inspiring')}\n\nSometimes watching something heartwarming can provide a gentle distraction and remind us of the beauty in life. What genre do you usually enjoy?`;
    } else {
      response = `Here are some movie recommendations:\n\n🍿 **Feel-good Films:**\n• ${getRandomMovie('uplifting')}\n• ${getRandomMovie('comforting')}\n• ${getRandomMovie('inspiring')}\n\nMovies can be a great way to take a mental break. Are you in the mood for something uplifting, inspiring, or thought-provoking?`;
    }
    return { response, requiresNotification: false };
  }
  
  // Context-aware responses with VARIETY
  if (message.includes('tell me more') || message.includes('more') || message.includes('elaborate')) {
    if (hasRecentAnxiety) {
      const responses = [
        "Let's dive deeper into managing your anxiety. Here are specific techniques:\n\n• **Progressive Muscle Relaxation** - Tense and release each muscle group systematically\n• **Box Breathing** - Inhale 4, hold 4, exhale 4, hold 4 - repeat 4 cycles\n• **5-4-3-2-1 Grounding** - Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste\n• **Mindfulness Meditation** - Focus on your breath, letting thoughts pass without judgment\n• **Gentle Movement** - Walking, stretching, or yoga to release physical tension\n\nWhich technique would you like to try right now?",
        "I'm glad you want to explore anxiety management further. Here's a deeper look:\n\n**Understanding Your Anxiety:**\n• Notice when it starts and what triggers it\n• Identify physical sensations (heart racing, tense muscles)\n• Challenge catastrophic thoughts with reality checks\n\n**Practical Tools:**\n• **4-7-8 Breathing**: Inhale 4 counts, hold 7, exhale 8\n• **Thought Stopping**: Say 'stop' and redirect to a neutral thought\n• **Temperature Change**: Splash cold water or hold ice\n\nWould you like guidance on practicing any of these?"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
      return { response, requiresNotification: false };
    }
    
    if (hasRecentDepression) {
      const responses = [
        "I'd like to help you explore your feelings more deeply. Depression can show up in different ways:\n\n**Physical:** Fatigue, changes in appetite/sleep, body aches\n**Emotional:** Sadness, emptiness, hopelessness, numbness\n**Cognitive:** Difficulty concentrating, negative thoughts, memory issues\n**Behavioral:** Withdrawal, loss of interest, avoiding activities\n\nWhat specific symptoms are you noticing? Understanding patterns helps us create targeted strategies.",
        "Let's look deeper into what you're experiencing. Depression affects people differently:\n\n**Common Signs:**\n• Loss of interest in things you used to enjoy\n• Feeling tired even after rest\n• Changes in sleep patterns (too much or too little)\n• Difficulty making decisions\n• Feelings of worthlessness or guilt\n\n**What Helps:**\n• Small daily routines (even just getting dressed)\n• Gentle movement (5-minute walk)\n• Connection with others\n• Professional support\n\nWhat would be most helpful for you right now?"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
      return { response, requiresNotification: false };
    }
    
    const responses = [
      "I'd be happy to explore this further! Could you tell me more specifically?\n\n• What thoughts or feelings are most prominent?\n• How is this affecting your daily life?\n• Have you noticed any patterns or triggers?\n• What would you like to work on or improve?\n\nThe more you share, the better I can support you with specific strategies.",
      "Let's dive deeper together. It might help to think about:\n\n• When did this feeling start?\n• What makes it better or worse?\n• How would you describe the intensity (mild, moderate, severe)?\n• What have you tried that's helped even a little?\n\nUnderstanding these details helps me give more personalized support."
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
    return { response, requiresNotification: false };
  }
  
  // ANXIETY with variety
  if (message.includes('anxious') || message.includes('anxiety') || message.includes('worried') || message.includes('nervous')) {
    const responses = [
      "I understand you're feeling anxious. That's completely normal and you're not alone. Try taking slow, deep breaths and focus on the present moment. Consider the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. Remember, anxiety is temporary and you have the strength to get through this.",
      "Anxiety can feel overwhelming, but there are effective ways to manage it. Start with deep breathing - try box breathing (4-4-4-4 counts). Ground yourself in the present by focusing on your immediate surroundings. Progressive muscle relaxation can also help - tense each muscle group for 5 seconds, then release. You're doing the right thing by reaching out for support.",
      "I hear that you're experiencing anxiety right now. First, let's regulate your nervous system:\n\n• **Belly Breathing**: Place hand on belly, breathe deeply into it\n• **4-7-8 Technique**: Inhale 4, hold 7, exhale 8\n• **Cold Compress**: On wrists or back of neck\n\nRemember, this feeling will pass. You've gotten through anxiety before, and you can do it again."
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
    return { response, requiresNotification: false };
  }
  
  // DEPRESSION/SADNESS with variety  
  if (message.includes('sad') || message.includes('depressed') || message.includes('down') || message.includes('blue') || message.includes('not feeling well') || message.includes('not well')) {
    const responses = [
      "I'm sorry you're feeling this way. Your feelings are completely valid. Try to be gentle with yourself today - you don't need to be productive or happy right now. Consider doing something small that usually brings you joy, even if motivation is low. If these feelings persist or intensify, please reach out to a mental health professional. You don't have to navigate this alone.",
      "Thank you for sharing that you're not feeling well. That takes courage. Sometimes the best we can do is acknowledge our feelings without judgment. Try:\n\n• A gentle walk outside (even 5 minutes helps)\n• Listening to music that comforted you before\n• Reaching out to someone you trust\n• Writing down your thoughts\n\nIf these feelings continue, professional support can be invaluable. Would you like information about finding a therapist?",
      "I hear you're going through a difficult time. Depression can make everything feel heavy. Right now, focus on the basics:\n\n**Gentle Self-Care:**\n• Drink water\n• Eat something (even just a snack)\n• Get some fresh air\n• Reach out to someone\n\nYou matter, and things can get better. Professional help is available if you'd like guidance on finding support in your area."
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
    return { response, requiresNotification: false };
  }
  
  // STRESS with variety
  if (message.includes('stress') || message.includes('stressed') || message.includes('pressure')) {
    const responses = [
      "Stress can feel overwhelming, but there are ways to manage it. Try breaking tasks into smaller, manageable steps. Deep breathing, progressive muscle relaxation, or even stepping outside for fresh air can help. Remember to prioritize self-care and don't hesitate to ask for help. You're doing better than you think.",
      "I understand you're under stress. Let's work on managing it:\n\n**Immediate Relief:**\n• Take 3 deep breaths\n• Step away for 5 minutes\n• Write down what's stressing you\n\n**Longer-term:**\n• Prioritize tasks (what MUST be done vs. can wait)\n• Set boundaries\n• Regular breaks\n• Exercise or movement\n\nYou don't have to handle everything at once. What's stressing you most right now?",
      "Stress is challenging, but manageable. Try the STOP technique:\n\n**S** - Stop what you're doing\n**T** - Take a breath\n**O** - Observe what's happening\n**P** - Proceed with intention\n\nAlso consider: delegating tasks, saying no when needed, and taking breaks. What specific situation is causing you stress?"
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
    return { response, requiresNotification: false };
  }
  
  // SLEEP with variety
  if (message.includes('sleep') || message.includes('insomnia') || message.includes('tired') || message.includes('exhausted') || message.includes('can\'t sleep')) {
    const responses = [
      "Good sleep is crucial for mental health. Try a consistent bedtime routine: avoid screens an hour before bed, keep your room cool and dark, and try relaxation techniques like reading or gentle stretching. If sleep problems persist, consider keeping a sleep diary. Quality sleep helps regulate your mood and energy.",
      "Sleep struggles can really impact your well-being. Here's a sleep-friendly routine:\n\n**Wind-down Routine:**\n• Turn off screens 1 hour before bed\n• Dim lights\n• Warm bath or shower\n• Gentle stretching\n• Read or listen to calming music\n\n**Sleep Environment:**\n• Cool temperature (65-68°F)\n• Dark room\n• Comfortable bedding\n• White noise if helpful\n\nWhat part of sleep is most challenging for you?",
      "I hear you're having trouble with sleep. This can really affect your mental health. Try:\n\n• **Consistent Sleep Schedule** - Same bedtime and wake time\n• **Bedroom for Sleep Only** - Work/TV elsewhere\n• **Relaxation Techniques** - Deep breathing or body scan meditation\n• **Limit Caffeine** - Especially after noon\n• **Get Up if Not Sleeping** - After 20 minutes, do something calming, then return\n\nIf this continues, consider speaking with a healthcare provider about sleep hygiene."
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
    return { response, requiresNotification: false };
  }
  
  // OVERWHELMED with variety
  if (message.includes('overwhelmed') || message.includes('too much') || message.includes('can\'t handle')) {
    const responses = [
      "Feeling overwhelmed is completely understandable. Try the 'one thing at a time' approach - focus on just the next small step rather than everything. It's okay to take breaks and ask for help. You don't have to handle everything alone. Sometimes admitting we need support is the bravest thing we can do.",
      "When everything feels like too much, let's break it down:\n\n**Right Now:**\n• Take 3 deep breaths\n• Name 1 thing you can do (even if it's small)\n• Do just that 1 thing\n\n**Today:**\n• Write down everything on your mind\n• Cross off what can wait\n• Focus on top 3 priorities only\n\nYou don't need to solve everything today. What's the most important thing right now?",
      "Overwhelm happens when too many things compete for your attention. Try:\n\n**Immediate:**\n• Stop and breathe\n• Drink water\n• Acknowledge that you're doing your best\n\n**Practical:**\n• List everything (get it out of your head)\n• Identify what's urgent vs. important\n• Delegate or postpone what you can\n• Tackle one thing at a time\n\nRemember, you're human, not a machine. What's overwhelming you most?"
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
    return { response, requiresNotification: false };
  }
  
  // General topics with variety
  if (message.includes('help') || message.includes('advice') || message.includes('guidance')) {
    const responses = [
      "I'm here to support you on your mental health journey. I can help with anxiety management, stress relief, sleep improvement, mood regulation, and coping strategies. Feel free to ask about specific challenges. Remember, seeking help is a sign of strength. What would you like help with today?",
      "I'm an AI assistant providing general emotional support. I can offer guidance on:\n\n• Coping strategies\n• Stress management\n• Mood regulation\n• Sleep hygiene\n• Self-care practices\n\n**Important:** I'm not a licensed therapist or medical professional. For severe or persistent issues, please consult with qualified mental health professionals.\n\nWhat would you like support with?",
      "I'm here to listen and provide general mental health support. I can suggest coping techniques, discuss strategies for managing difficult emotions, and offer encouragement. \n\n**Please note:** I am an AI assistant, not a licensed therapist. For professional help, therapy, or medical concerns, please consult qualified healthcare providers.\n\nWhat specific area would you like to explore?"
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
    return { response, requiresNotification: false };
  }
  
  // THERAPY/PROFESSIONAL HELP
  if (message.includes('therapy') || message.includes('counselor') || message.includes('psychologist') || message.includes('professional help')) {
    response = "Seeking professional help is a courageous and important step. Therapy provides tools and strategies tailored to your needs. Consider:\n\n**Resources:**\n• Licensed therapists or counselors (find at PsychologyToday.com)\n• Psychologists or psychiatrists\n• Local mental health clinics\n• Online therapy platforms (BetterHelp, Talkspace)\n• University counseling centers (if you're a student)\n• Employee Assistance Programs (if through work)\n• Support groups (NAMI, DBSA)\n\n**Remember:** There's no shame in asking for help. Mental health professionals are trained to support you. Would you like information on finding providers in your area?";
    return { response, requiresNotification: false };
  }
  
  // COVER EVERYTHING ELSE with variety  
  // Randomize general responses to avoid same response
  const generalResponses = [
    "Thank you for sharing that with me. I'm here to listen and support you. Mental health is a journey with ups and downs, and it's okay to not be okay. Try to be patient and kind with yourself. If you're struggling with something specific, feel free to tell me more. You're taking important steps by reaching out.\n\n*I am an AI assistant providing general emotional support, not a licensed therapist or medical professional.*",
    "I appreciate you opening up to me. That takes courage. Remember, feelings are temporary even when they don't feel that way. What you're experiencing is valid. If there's something specific you'd like help with - anxiety, stress, sleep, motivation - I'm here to support you.\n\n*Note: I am an AI providing general support. For severe or persistent concerns, please consult qualified mental health professionals.*",
    "Thanks for reaching out. I'm here to listen and provide support. Mental health challenges are real and valid. Sometimes just talking about what you're going through can help. What's on your mind today? I can help with coping strategies, stress management, or just be here to listen.\n\n*I am an AI assistant for general emotional support, not a replacement for professional therapy.*"
  ];
  
  response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
  return { response, requiresNotification: false };
}

// Get conversation history
router.get('/conversation', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = getConversation(userId);
    
    // Return only user and assistant messages (exclude system message)
    const history = conversation
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date().toISOString()
      }));

    res.json({ conversation: history });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to retrieve conversation' });
  }
});

// Clear conversation history
router.delete('/conversation', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    conversations.delete(userId);
    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({ message: 'Failed to clear conversation' });
  }
});

module.exports = router;
