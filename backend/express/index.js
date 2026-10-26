import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Sentiment from 'sentiment';
import OpenAI from 'openai';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required (see .env.example)');
}
const sentiment = new Sentiment();

// Initialize OpenAI API (without a key the chatbot falls back to keyword replies)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'missing-openai-api-key';
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// AI Model Configuration
// OpenAI Models:
// - 'gpt-3.5-turbo' (recommended: fast, affordable, high quality)
// - 'gpt-4' (most powerful, more expensive)
// - 'gpt-4-turbo-preview' (faster GPT-4, lower cost)
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// Crisis keywords for detection
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'self-harm', 'self harm', 'kill myself', 'end my life', 'hurt myself',
  'overdose', 'cutting myself', 'cut myself', 'want to die', 'better off dead', 'no reason to live',
  'can\'t go on', 'give up on life', 'end it all', 'harm myself'
];

const CRISIS_REGEX = new RegExp(
  `\\b(?:${CRISIS_KEYWORDS.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
);

// Word-boundary match so e.g. "cutting vegetables" does not trigger a crisis response
function isCrisisMessage(message) {
  return CRISIS_REGEX.test(String(message));
}

const CRISIS_REPLY = 'I\'m very concerned about what you\'re sharing. Please know that help is available right now. 🇮🇳 India Crisis Helplines: AASRA (24x7) at +91 9820466726, Vandrevala Foundation at 1860 2662 345 or 1800 2333 330, iCall at +91 9152987821, or NIMHANS at 080-46110007. Emergency services: 112. You don\'t have to face this alone - professional help is just a call away.';

app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim())
}));
app.use(express.json({ limit: '100kb' }));

// Brute-force protection for auth endpoints and cost protection for the paid chatbot API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' }
});
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You are sending messages too quickly, please slow down' }
});
app.use(['/api/login', '/api/register'], authLimiter);
app.use('/api/chatbot', chatLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'Express backend running!' });
});

// User registration
app.post('/api/register', async (req, res) => {
  // Role is never taken from the client; self-registration always creates a regular user.
  // Counselor and admin accounts must be created by an admin (PUT /api/users/:id) or a seed script.
  const { username, fullName, email, password } = req.body;

  // Validate required fields
  if (!username || !fullName || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields: username, fullName, email, password' });
  }
  
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        username,
        fullName,
        email,
        password: hashedPassword,
        role: 'user'
      },
    });
    
    // Return only public information
    res.json({ 
      user: { 
        id: user.id,
        username: user.username,
        role: user.role
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'User registration failed' });
  }
});

// User login with JWT
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    
    // User sees their own full information on login
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username || `user${user.id}`,
        fullName: user.fullName,
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Example protected route
app.get('/api/profile', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // User accessing their own profile gets all their data
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username || `user${user.id}`,
        fullName: user.fullName, 
        email: user.email, 
        role: user.role,
        createdAt: user.createdAt
      } 
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// JWT authentication middleware
function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Role-based middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Optional JWT authentication middleware (for routes that support anonymous access)
function optionalAuthenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // If token is invalid, continue as anonymous
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// Helper function: Get comment filter for visibility
function getCommentFilter(userRole) {
  // Admins and counselors can see all comments except soft-deleted ones
  if (userRole === 'admin' || userRole === 'counselor') {
    return {
      deleted: false
    };
  }
  
  // Regular users can only see non-deleted, non-hidden comments
  return {
    deleted: false,
    hiddenByModerator: false
  };
}

// Helper function: Check if user can moderate
function canModerate(userRole) {
  return userRole === 'admin' || userRole === 'counselor';
}

// ============ USER PRIVACY HELPER FUNCTIONS ============

/**
 * Get public user info (visible to everyone)
 * Returns: id, username, role
 */
function getPublicUserInfo(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username || `user${user.id}`, // Fallback for legacy users
    role: user.role
  };
}

/**
 * Get user info based on viewer's relationship and role
 * @param {Object} user - The user whose info is being accessed
 * @param {Object} viewer - The user who is viewing (from req.user)
 * @param {Object} prisma - Prisma client instance
 * @returns {Promise<Object>} User info based on privacy rules
 */
async function getUserInfoBasedOnPrivacy(user, viewer, prismaClient) {
  if (!user) return null;
  
  // If no viewer, return only public info
  if (!viewer) {
    return getPublicUserInfo(user);
  }
  
  // Admin can see everything
  if (viewer.role === 'admin') {
    return {
      id: user.id,
      username: user.username || `user${user.id}`,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      _privacyLevel: 'admin'
    };
  }
  
  // Counselor can see fullName and email of their connected users
  if (viewer.role === 'counselor') {
    // Check if there's an appointment connection between counselor and user
    const appointment = await prismaClient.appointment.findFirst({
      where: {
        OR: [
          { userId: user.id, counselorId: viewer.userId },
          { userId: viewer.userId, counselorId: user.id }
        ]
      }
    });
    
    if (appointment) {
      // Counselor has a connection with this user
      return {
        id: user.id,
        username: user.username || `user${user.id}`,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        _privacyLevel: 'counselor-connection'
      };
    }
  }
  
  // Regular user viewing another user or counselor without connection
  return getPublicUserInfo(user);
}

/**
 * Format user select statement based on viewer role
 * Returns fields that should be selected from database
 */
function getUserSelectFields(viewerRole) {
  const baseFields = {
    id: true,
    username: true,
    role: true
  };
  
  // Admin and counselor can see all fields (privacy filtering happens in getUserInfoBasedOnPrivacy)
  if (viewerRole === 'admin' || viewerRole === 'counselor') {
    return {
      ...baseFields,
      fullName: true,
      email: true,
      createdAt: true
    };
  }
  
  // Regular users only see public fields
  return baseFields;
}

// Returns the session only if the caller owns it (anonymous callers only match anonymous sessions)
async function getOwnedChatSession(sessionId, userId) {
  if (!sessionId || Number.isNaN(Number(sessionId))) return null;
  const session = await prisma.chatSession.findUnique({ where: { id: Number(sessionId) } });
  if (!session || (session.userId ?? null) !== (userId ?? null)) return null;
  return session;
}

// Finds (or creates) the caller's chat session and stores the user message and bot reply.
// Failures are logged and never block the chat reply; returns the session or null.
async function storeChatExchange({ sessionId, user, message, botReply, emotion }) {
  const userId = user && user.userId ? user.userId : null;
  let chatSession = null;
  try {
    chatSession = await getOwnedChatSession(sessionId, userId);
    if (!chatSession) {
      chatSession = await prisma.chatSession.create({ data: { userId } });
    }
    await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        sender: userId ? user.email : 'anonymous',
        content: message,
        emotion,
      },
    });
    await prisma.message.create({
      data: { chatSessionId: chatSession.id, sender: 'bot', content: botReply, emotion: null },
    });
  } catch (dbError) {
    console.error('Failed to store chat history:', dbError.message);
  }
  return chatSession;
}

// Chatbot API route
app.post('/api/chatbot',optionalAuthenticateJWT, async (req, res) => {
  const { message, anonymous, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  // Determine if user is authenticated
  const isAuthenticated = req.user && req.user.userId;
  const isAnonymous = anonymous || !isAuthenticated;

  // Analyze sentiment
  const sentimentAnalysis = sentiment.analyze(message);
  const sentimentScore = sentimentAnalysis.score; // Positive = positive sentiment, Negative = negative sentiment

  // Detect crisis keywords
  const crisis = isCrisisMessage(message);

  // Generate bot reply with expanded patterns and sentiment awareness
  let botReply = 'I understand. Can you tell me more about what you\'re feeling?';
  
  const lowerMessage = message.toLowerCase();
  
  // CRISIS DETECTION (highest priority)
  if (crisis) {
    botReply = CRISIS_REPLY;
  }
  // DEPRESSION & HOPELESSNESS
  else if (lowerMessage.includes('depressed') || lowerMessage.includes('depression')) {
    botReply = 'I hear that you\'re feeling depressed. Depression is a real medical condition, and you don\'t have to face it alone. Have you considered talking to a mental health professional? I\'m here to listen.';
  }
  else if (lowerMessage.includes('hopeless') || lowerMessage.includes('no hope') || lowerMessage.includes('pointless')) {
    botReply = 'Feeling hopeless can be overwhelming, but please know that these feelings can change. You matter, and your life has value. Would it help to talk about what\'s making you feel this way?';
  }
  else if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
    botReply = 'Loneliness can be really difficult. I\'m here with you right now. Have you thought about reaching out to friends, family, or joining support groups? Sometimes connecting with others can help.';
  }
  // ANXIETY & PANIC
  else if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
    botReply = 'Anxiety can be overwhelming. Have you tried any breathing exercises or mindfulness techniques? I can guide you through some grounding exercises if you\'d like. What triggers your anxiety?';
  }
  else if (lowerMessage.includes('panic') || lowerMessage.includes('panic attack')) {
    botReply = 'Panic attacks can be frightening. Try the 5-4-3-2-1 technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. Focus on your breathing. I\'m here with you.';
  }
  else if (lowerMessage.includes('worried') || lowerMessage.includes('worry')) {
    botReply = 'It sounds like you\'re carrying a lot of worry. Sometimes it helps to write down your concerns or talk them through. What\'s weighing on your mind the most right now?';
  }
  // STRESS & OVERWHELM
  else if (lowerMessage.includes('stressed') || lowerMessage.includes('stress')) {
    botReply = 'Stress is a common challenge. What are the main sources of stress in your life right now? Sometimes breaking things down into smaller, manageable steps can help reduce overwhelm.';
  }
  else if (lowerMessage.includes('overwhelmed') || lowerMessage.includes('too much') || lowerMessage.includes('can\'t handle')) {
    botReply = 'Feeling overwhelmed is a sign you might be taking on too much. It\'s okay to ask for help or take a break. What\'s the most urgent thing you\'re dealing with right now?';
  }
  // SLEEP & FATIGUE
  else if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('can\'t sleep')) {
    botReply = 'Sleep is so important for mental health. Are you experiencing difficulty falling asleep or staying asleep? Creating a bedtime routine and limiting screens before bed can help. How long has this been going on?';
  }
  else if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('fatigue')) {
    botReply = 'Feeling exhausted can affect everything. Are you getting enough rest? Sometimes persistent fatigue can be a sign of burnout or depression. How are you taking care of yourself?';
  }
  // ANGER & FRUSTRATION
  else if (lowerMessage.includes('angry') || lowerMessage.includes('anger') || lowerMessage.includes('furious')) {
    botReply = 'Anger is a valid emotion. It often points to something that matters to you. What\'s behind your anger? Sometimes talking about it can help you process these feelings.';
  }
  else if (lowerMessage.includes('frustrated') || lowerMessage.includes('frustration')) {
    botReply = 'Frustration can build up when things aren\'t going as planned. What\'s frustrating you right now? Let\'s talk through it together.';
  }
  // GRIEF & LOSS
  else if (lowerMessage.includes('grief') || lowerMessage.includes('grieving') || lowerMessage.includes('loss')) {
    botReply = 'I\'m sorry for your loss. Grief is a natural process, and everyone experiences it differently. There\'s no "right" way to grieve. Would you like to share what you\'re going through?';
  }
  else if (lowerMessage.includes('miss') || lowerMessage.includes('died') || lowerMessage.includes('passed away')) {
    botReply = 'Losing someone is incredibly painful. Please know that it\'s okay to feel sad, angry, or confused. Grief takes time. I\'m here to listen if you want to talk about it.';
  }
  // RELATIONSHIPS
  else if (lowerMessage.includes('breakup') || lowerMessage.includes('broke up') || lowerMessage.includes('relationship ended')) {
    botReply = 'Breakups are really tough. It\'s normal to feel a range of emotions right now. Give yourself time to heal. What has been the hardest part for you?';
  }
  else if (lowerMessage.includes('fight') || lowerMessage.includes('argument') || lowerMessage.includes('conflict')) {
    botReply = 'Conflicts in relationships can be stressful. Communication and understanding each other\'s perspectives can help. Do you want to talk about what happened?';
  }
  // SELF-ESTEEM & CONFIDENCE
  else if (lowerMessage.includes('worthless') || lowerMessage.includes('not good enough') || lowerMessage.includes('hate myself')) {
    botReply = 'Those thoughts must be very painful. Please know that you have inherent worth, regardless of what you\'re going through. These negative thoughts don\'t reflect who you really are. Have you talked to anyone about how you\'re feeling?';
  }
  else if (lowerMessage.includes('confidence') || lowerMessage.includes('insecure') || lowerMessage.includes('self-esteem')) {
    botReply = 'Self-esteem challenges are common, but you can build confidence over time. Start by noticing your strengths and celebrating small wins. What\'s one thing you\'re proud of?';
  }
  // COPING & HELP-SEEKING
  else if (lowerMessage.includes('therapy') || lowerMessage.includes('therapist') || lowerMessage.includes('counselor')) {
    botReply = 'Seeking therapy is a brave and positive step. A therapist can provide personalized support and coping strategies. In India, you can find therapists through Practo, TalktoAngel, or Amaha. Would you like more information about mental health resources?';
  }
  else if (lowerMessage.includes('medication') || lowerMessage.includes('meds')) {
    botReply = 'Medication can be an important part of treatment for some people. If you\'re considering medication, it\'s best to discuss it with a healthcare provider who can assess your needs.';
  }
  else if (lowerMessage.includes('coping') || lowerMessage.includes('cope') || lowerMessage.includes('deal with')) {
    botReply = 'Finding healthy coping strategies is important. Some options include exercise, journaling, meditation, talking to friends, or creative activities. What has helped you in the past?';
  }
  // POSITIVE EMOTIONS (with sentiment boost)
  else if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('better') || lowerMessage.includes('great')) {
    if (sentimentScore > 2) {
      botReply = 'That\'s wonderful to hear! I\'m so glad you\'re feeling positive. It\'s important to celebrate these moments. What has been helping you feel this way?';
    } else {
      botReply = 'I\'m glad things are looking up! What positive changes have you noticed?';
    }
  }
  else if (lowerMessage.includes('excited') || lowerMessage.includes('looking forward')) {
    botReply = 'That\'s fantastic! Having something to look forward to can be really uplifting. What are you excited about?';
  }
  // GREETINGS
  else if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.includes('hey')) {
    botReply = 'Hello! I\'m SereneBot, here to listen and support you. How are you feeling today?';
  }
  // GRATITUDE
  else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    botReply = 'You\'re very welcome! I\'m here anytime you need to talk. How else can I support you today?';
  }
  // GOODBYE
  else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
    botReply = 'Take care of yourself! Remember, I\'m here whenever you need to talk. You don\'t have to face things alone. Goodbye for now!';
  }
  // SENTIMENT-BASED FALLBACK
  else if (sentimentScore < -2) {
    // Very negative sentiment
    botReply = 'I can sense you\'re going through a difficult time. Your feelings are valid, and I\'m here to listen. Would you like to tell me more about what\'s bothering you?';
  }
  else if (sentimentScore > 2) {
    // Very positive sentiment
    botReply = 'It sounds like you\'re in a good place! That\'s great to hear. What\'s been going well for you?';
  }

  // Store chat history in DB
  let chatSession;
  try {
    chatSession = await getOwnedChatSession(sessionId, isAnonymous ? null : req.user.userId);
    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: isAnonymous ? null : req.user.userId,
        },
      });
    }

    // Store user message
    await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        sender: isAnonymous ? 'anonymous' : req.user.email,
        content: message,
      },
    });
    
    // Store bot reply
    await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        sender: 'bot',
        content: botReply,
      },
    });
  } catch (err) {
    // Log but do not block reply
    console.error('Failed to store chat history:', err.message);
  }

  res.json({ reply: botReply, sessionId: chatSession?.id, sentiment: sentimentScore });
});

// Advanced Chatbot API with Emotion Analysis and Text Generation
app.post('/api/chatbot/emotion', optionalAuthenticateJWT, async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  // Determine if user is authenticated
  const isAuthenticated = req.user && req.user.userId;
  const isAnonymous = !isAuthenticated;
  
  let chatSession = null;
  let detectedEmotion = 'neutral';
  let botReply = 'I understand. Can you tell me more about what you\'re feeling?';

  // Crisis messages skip the LLM and always get the helpline response
  if (isCrisisMessage(message)) {
    detectedEmotion = 'sadness';
    chatSession = await storeChatExchange({ sessionId, user: req.user, message, botReply: CRISIS_REPLY, emotion: detectedEmotion });
    return res.json({
      reply: CRISIS_REPLY,
      sessionId: chatSession?.id || null,
      emotion: detectedEmotion,
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Step 1: Run emotion analysis using OpenAI
    try {
      console.log('🔍 Attempting OpenAI emotion analysis...');
      
      const emotionPrompt = `Analyze the emotion in this message and respond with ONLY ONE WORD from this list: anger, disgust, fear, joy, sadness, surprise, neutral.

Message: "${message}"

Emotion:`;
      
      const emotionResponse = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: 'You are an emotion detection system. Respond with only one word: anger, disgust, fear, joy, sadness, surprise, or neutral.' },
          { role: 'user', content: emotionPrompt }
        ],
        temperature: 0.3,
        max_tokens: 10
      });
      
      // Get the detected emotion
      const rawEmotion = emotionResponse.choices[0]?.message?.content?.trim().toLowerCase();
      const validEmotions = ['anger', 'disgust', 'fear', 'joy', 'sadness', 'surprise', 'neutral'];
      
      if (rawEmotion && validEmotions.includes(rawEmotion)) {
        detectedEmotion = rawEmotion;
        console.log(`✅ OpenAI detected emotion: ${detectedEmotion}`);
      } else {
        console.log(`⚠️ Invalid emotion response: ${rawEmotion}, defaulting to neutral`);
        detectedEmotion = 'neutral';
      }
    } catch (emotionError) {
      console.error('❌ Emotion analysis failed:', emotionError.message);
      console.log('🔄 Falling back to keyword detection...');
      
      // Enhanced fallback: Keyword-based emotion detection
      const lowerMessage = message.toLowerCase();
      
      // Emotion keywords
      const emotionKeywords = {
        sadness: ['sad', 'depressed', 'down', 'hopeless', 'unhappy', 'miserable', 'crying', 'tears', 'grief', 'lonely', 'empty', 'worthless'],
        fear: ['anxious', 'anxiety', 'worried', 'scared', 'afraid', 'panic', 'nervous', 'stress', 'overwhelmed', 'terrified', 'frightened'],
        anger: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated', 'rage', 'hate', 'betrayed'],
        joy: ['happy', 'excited', 'great', 'wonderful', 'amazing', 'thrilled', 'glad', 'delighted', 'love', 'blessed', 'grateful'],
        disgust: ['disgusted', 'gross', 'awful', 'terrible', 'horrible', 'sick'],
        surprise: ['shocked', 'surprised', 'unexpected', 'sudden', 'wow', 'can\'t believe']
      };
      
      // Count keyword matches for each emotion
      let maxMatches = 0;
      let detectedByKeyword = 'neutral';
      
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          detectedByKeyword = emotion;
        }
      }
      
      // If keywords detected emotion, use it; otherwise use sentiment
      if (maxMatches > 0) {
        detectedEmotion = detectedByKeyword;
        console.log(`🔑 Keyword detection: ${detectedEmotion} (${maxMatches} matches)`);
      } else {
        // Fallback to basic sentiment
        const sentimentAnalysis = sentiment.analyze(message);
        if (sentimentAnalysis.score < -2) detectedEmotion = 'sadness';
        else if (sentimentAnalysis.score > 2) detectedEmotion = 'joy';
        else detectedEmotion = 'neutral';
        console.log(`📊 Sentiment analysis: ${detectedEmotion} (score: ${sentimentAnalysis.score})`);
      }
    }
    
    // Step 2: Generate empathetic prompt based on detected emotion
    const emotionPrompts = {
      anger: "The user is expressing anger or frustration. Respond with validation, empathy, and help them process their feelings constructively.",
      disgust: "The user is expressing disgust or displeasure. Respond with understanding and help them explore what's bothering them.",
      fear: "The user is expressing fear or anxiety. Respond with reassurance, calmness, and practical coping strategies.",
      joy: "The user is expressing happiness or joy. Respond with celebration and encouragement to savor positive moments.",
      sadness: "The user is expressing sadness or grief. Respond with compassion, validation, and gentle support.",
      surprise: "The user is expressing surprise. Respond with curiosity and help them process this unexpected experience.",
      neutral: "The user is sharing something. Respond with empathy and understanding, encouraging them to share more."
    };
    
    const emotionContext = emotionPrompts[detectedEmotion] || emotionPrompts.neutral;
    
    // Step 3: Generate empathetic response using OpenAI
    try {
      console.log('💬 Generating empathetic response with OpenAI...');
      
      const chatResponse = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { 
            role: 'system', 
            content: `You are SereneBot, a compassionate mental health support chatbot. The user is currently feeling ${detectedEmotion}. ${emotionContext} Keep responses brief (2-4 sentences), warm, and supportive. Focus on validation, empathy, and gentle guidance.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 150,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });
      
      // Extract the response
      if (chatResponse.choices[0]?.message?.content) {
        botReply = chatResponse.choices[0].message.content.trim();
        console.log('✅ AI-generated response used');
      } else {
        throw new Error('No response content returned');
      }
    } catch (genError) {
      console.error('❌ Text generation failed:', genError.message);
      // Fallback to emotion-specific pre-written responses
      botReply = generateEmotionResponse(detectedEmotion, message);
    }
    
    // Steps 4-5: Retrieve or create chat session and store messages
    chatSession = await storeChatExchange({ sessionId, user: req.user, message, botReply, emotion: detectedEmotion });

    // Step 6: Return response
    res.json({ 
      reply: botReply, 
      sessionId: chatSession?.id || sessionId, // Return existing sessionId if DB failed
      emotion: detectedEmotion,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chatbot error:', error.message);
    
    // Even on error, try to maintain session continuity
    res.status(200).json({ 
      reply: 'I apologize, I\'m having some technical difficulties, but I\'m still here to listen. Can you tell me more about what\'s on your mind?',
      sessionId: sessionId || null,
      emotion: detectedEmotion,
      error: 'partial_failure',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to generate emotion-based fallback responses
function generateEmotionResponse(emotion, userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  const responses = {
    anger: [
      "I can hear that you're feeling angry, and that's completely valid. Your feelings matter. Would you like to talk about what triggered this?",
      "It sounds like something has really upset you. I'm here to listen without judgment. What happened that made you feel this way?",
      "Anger often points to something important. Let's explore what's behind these feelings together."
    ],
    disgust: [
      "I understand that something is bothering you deeply. Your reaction makes sense. Would you like to share more about what's troubling you?",
      "It sounds like this situation is really difficult for you. I'm here to support you as you process these feelings."
    ],
    fear: [
      "I hear that you're feeling anxious or afraid. It takes courage to share that. Let's work through this together.",
      "Fear can be overwhelming, but you're not alone. Take a deep breath. What's worrying you most right now?",
      "It's okay to feel scared. Your feelings are valid. Would you like to talk about what's causing this anxiety?"
    ],
    joy: [
      "That's wonderful! I'm so glad to hear you're feeling positive. What's been bringing you joy?",
      "It's great to celebrate these happy moments with you! Tell me more about what's going well.",
      "Your happiness is contagious! I'd love to hear more about what's making you feel this way."
    ],
    sadness: [
      "I'm so sorry you're going through this difficult time. Your feelings are completely valid, and I'm here with you.",
      "Sadness can feel heavy. Please know that it's okay to feel this way, and you don't have to face it alone. I'm listening.",
      "I hear your pain, and I want you to know that what you're feeling matters. Would you like to talk about it?"
    ],
    surprise: [
      "That sounds like quite an unexpected turn! How are you processing this?",
      "Surprises can be disorienting. Take your time to process what happened. I'm here to listen."
    ],
    neutral: [
      "I'm listening. Tell me more about what's on your mind.",
      "I'm here for you. What would you like to talk about?",
      "Thank you for sharing. Can you tell me more about how you're feeling?"
    ]
  };
  
  const emotionResponses = responses[emotion] || responses.neutral;
  
  // Select response based on message content for better relevance
  if (lowerMessage.includes('help') || lowerMessage.includes('what should i')) {
    return emotionResponses[0];
  } else if (lowerMessage.includes('why') || lowerMessage.includes('how')) {
    return emotionResponses[emotionResponses.length > 1 ? 1 : 0];
  } else {
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
  }
}

// User CRUD endpoints (protected)
app.get('/api/users', authenticateJWT, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ 
      select: { id: true, username: true, fullName: true, email: true, role: true, createdAt: true } 
    });
    
    // Format based on viewer role
    const isPrivileged = req.user.role === 'admin';
    const formattedUsers = users.map(user => isPrivileged ? {
      id: user.id,
      username: user.username || `user${user.id}`,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    } : getPublicUserInfo(user));
    
    res.json({ users: formattedUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', authenticateJWT, async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);
    const user = await prisma.user.findUnique({ 
      where: { id: targetUserId }, 
      select: { id: true, username: true, fullName: true, email: true, role: true, createdAt: true } 
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Use privacy logic to determine what to show
    const formattedUser = await getUserInfoBasedOnPrivacy(user, req.user, prisma);
    
    res.json({ user: formattedUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', authenticateJWT, async (req, res) => {
  try {
    const { username, fullName, email, role } = req.body;
    const targetUserId = Number(req.params.id);
    
    // Only admin or the user themselves can update
    if (req.user.role !== 'admin' && req.user.userId !== targetUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Non-admins can't change role
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined && req.user.role === 'admin') updateData.role = role;
    
    const user = await prisma.user.update({ 
      where: { id: targetUserId }, 
      data: updateData,
      select: { id: true, username: true, fullName: true, email: true, role: true } 
    });
    
    res.json({ user: {
      id: user.id, 
      username: user.username || `user${user.id}`,
      fullName: user.fullName,
      email: user.email, 
      role: user.role
    } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticateJWT, async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);

    // Only admin or the user themselves can delete
    if (req.user.role !== 'admin' && req.user.userId !== targetUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.user.delete({ where: { id: targetUserId } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Appointment/Booking System API routes
const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

async function isCounselorUser(id) {
  if (!Number.isInteger(id)) return false;
  const counselor = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  return counselor?.role === 'counselor';
}

// Privileged viewers (admin/counselor) get full identity; everyone else gets public info only
function formatAppointmentPerson(person, isPrivileged) {
  if (!person) return null;
  if (!isPrivileged) return getPublicUserInfo(person);
  return {
    id: person.id,
    username: person.username || `user${person.id}`,
    fullName: person.fullName,
    email: person.email,
    role: person.role
  };
}

function formatAppointment(appointment, isPrivileged) {
  return {
    ...appointment,
    user: formatAppointmentPerson(appointment.user, isPrivileged),
    counselor: formatAppointmentPerson(appointment.counselor, isPrivileged)
  };
}

// Create appointment
app.post('/api/appointments', authenticateJWT, async (req, res) => {
  const { counselorId, scheduledAt } = req.body;
  if (!counselorId || !scheduledAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime()) || when <= new Date()) {
      return res.status(400).json({ error: 'scheduledAt must be a valid future date' });
    }
    if (!(await isCounselorUser(Number(counselorId)))) {
      return res.status(400).json({ error: 'counselorId must belong to a counselor' });
    }
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user.userId,
        counselorId: Number(counselorId),
        scheduledAt: when,
        status: 'pending'
      }
    });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Get all appointments (with optional filters)
app.get('/api/appointments', authenticateJWT, async (req, res) => {
  try {
    const { userId, counselorId, status } = req.query;
    const where = {};
    
    if (userId) where.userId = Number(userId);
    if (counselorId) where.counselorId = Number(counselorId);
    if (status) where.status = status;

    // Only admins can list everyone's appointments; others are limited to ones they are part of
    if (req.user.role === 'counselor') {
      where.AND = [{ OR: [{ userId: req.user.userId }, { counselorId: req.user.userId }] }];
    } else if (req.user.role !== 'admin') {
      where.userId = req.user.userId;
    }
    
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, fullName: true, email: true, role: true } },
        counselor: { select: { id: true, username: true, fullName: true, email: true, role: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });
    
    // Format user info based on privacy rules
    // Counselors and admins see full info in appointments (therapeutic relationship)
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'counselor';
    const formattedAppointments = appointments.map(apt => formatAppointment(apt, isPrivileged));
    
    res.json({ appointments: formattedAppointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointments for a specific counselor (counselor view)
app.get('/api/appointments/counselor/:counselorId', authenticateJWT, requireRole('counselor', 'admin'), async (req, res) => {
  try {
    const counselorId = Number(req.params.counselorId);
    
    // Ensure counselors can only see their own appointments unless admin
    if (req.user.role === 'counselor' && req.user.userId !== counselorId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const appointments = await prisma.appointment.findMany({
      where: { counselorId },
      include: {
        user: { select: { id: true, username: true, fullName: true, email: true, role: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });
    
    // Counselors see full patient info in their appointments
    const formattedAppointments = appointments.map(apt => ({
      ...apt,
      user: {
        id: apt.user.id,
        username: apt.user.username || `user${apt.user.id}`,
        fullName: apt.user.fullName,
        email: apt.user.email,
        role: apt.user.role
      }
    }));
    
    res.json({ appointments: formattedAppointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch counselor appointments' });
  }
});

// Get specific appointment
app.get('/api/appointments/:id', authenticateJWT, async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, username: true, fullName: true, email: true, role: true } },
        counselor: { select: { id: true, username: true, fullName: true, email: true, role: true } }
      }
    });
    
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    
    // Check access rights: admins see all, everyone else only appointments they are part of
    if (req.user.role !== 'admin' &&
        appointment.userId !== req.user.userId &&
        appointment.counselorId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Format with full info for admins/counselors, public info for regular users viewing their own appointment
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'counselor';
    res.json({ appointment: formatAppointment(appointment, isPrivileged) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Update appointment (including status management)
app.put('/api/appointments/:id', authenticateJWT, async (req, res) => {
  try {
    const { scheduledAt, status, counselorId } = req.body;
    const appointmentId = Number(req.params.id);
    
    // Fetch existing appointment
    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });
    
    // Check permissions
    const isCounselor = req.user.role === 'counselor' && existing.counselorId === req.user.userId;
    const isOwner = existing.userId === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isCounselor && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Build update data
    const updateData = {};
    if (scheduledAt) {
      const when = new Date(scheduledAt);
      if (Number.isNaN(when.getTime()) || when <= new Date()) {
        return res.status(400).json({ error: 'scheduledAt must be a valid future date' });
      }
      updateData.scheduledAt = when;
    }
    if (status) {
      if (!APPOINTMENT_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${APPOINTMENT_STATUSES.join(', ')}` });
      }
      // The patient may only cancel; confirming/completing is for the counselor or an admin
      if (!isAdmin && !isCounselor && status !== 'cancelled') {
        return res.status(403).json({ error: 'You can only cancel your own appointment' });
      }
      updateData.status = status;
    }
    if (counselorId) {
      // Reassigning the counselor is an admin action
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only an admin can reassign the counselor' });
      }
      if (!(await isCounselorUser(Number(counselorId)))) {
        return res.status(400).json({ error: 'counselorId must belong to a counselor' });
      }
      updateData.counselorId = Number(counselorId);
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        user: { select: { id: true, username: true, fullName: true, email: true, role: true } },
        counselor: { select: { id: true, username: true, fullName: true, email: true, role: true } }
      }
    });
    
    // Format with full info for admins/counselors
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'counselor';
    res.json({ appointment: formatAppointment(appointment, isPrivileged) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Delete appointment
app.delete('/api/appointments/:id', authenticateJWT, async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });
    
    // Only owner or admin can delete
    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await prisma.appointment.delete({ where: { id: appointmentId } });
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Peer Support Module API routes
// Create post
app.post('/api/posts', authenticateJWT, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  try {
    const post = await prisma.post.create({
      data: {
        userId: req.user.userId,
        title,
        content
      },
      include: {
        user: { select: { id: true, username: true, role: true } }
      }
    });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts
app.get('/api/posts', optionalAuthenticateJWT, async (req, res) => {
  try {
    const { flagged } = req.query;
    const where = {};
    const userRole = req.user?.role || 'user';
    
    // Only show flagged posts to admins/counselors
    if (flagged === 'true') {
      where.flagged = true;
    } else {
      where.flagged = false; // Default: hide flagged posts
    }
    
    // Get comment filter based on user role
    const commentFilter = getCommentFilter(userRole);
    
    const posts = await prisma.post.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, role: true } },
        comments: {
          where: commentFilter,
          include: {
            user: { select: { id: true, username: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Format user info - use public username only
    const postsWithPublicInfo = posts.map(post => ({
      ...post,
      user: getPublicUserInfo(post.user),
      comments: post.comments.map(comment => ({
        ...comment,
        user: getPublicUserInfo(comment.user)
      }))
    }));
    
    res.json({ posts: postsWithPublicInfo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get all flagged posts (for admin dashboard); must be registered before /api/posts/:id
app.get('/api/posts/flagged', authenticateJWT, requireRole('admin', 'counselor'), async (req, res) => {
  try {
    const flaggedPosts = await prisma.post.findMany({
      where: { flagged: true },
      include: {
        user: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ posts: flaggedPosts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flagged posts' });
  }
});

// Get specific post with comments
app.get('/api/posts/:id', optionalAuthenticateJWT, async (req, res) => {
  try {
    const userRole = req.user?.role || 'user';
    const commentFilter = getCommentFilter(userRole);
    
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, username: true, role: true } },
        comments: {
          where: commentFilter,
          include: {
            user: { select: { id: true, username: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Format user info - use public username only
    const postWithPublicInfo = {
      ...post,
      user: getPublicUserInfo(post.user),
      comments: post.comments.map(comment => ({
        ...comment,
        user: getPublicUserInfo(comment.user)
      }))
    };
    
    res.json({ post: postWithPublicInfo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Update post
app.put('/api/posts/:id', authenticateJWT, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { title, content } = req.body;
    
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    
    // Only owner or admin can edit
    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const post = await prisma.post.update({
      where: { id: postId },
      data: { title, content },
      include: {
        user: { select: { id: true, username: true, role: true } }
      }
    });
    
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
app.delete('/api/posts/:id', authenticateJWT, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    
    // Only owner or admin can delete
    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await prisma.post.delete({ where: { id: postId } });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like/support a post
app.post('/api/posts/:id/like', authenticateJWT, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user.userId;
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // One like per user: liking again removes the like
    const key = { postId_userId: { postId, userId } };
    const existing = await prisma.postReaction.findUnique({ where: key });
    const [, updated] = await prisma.$transaction([
      existing
        ? prisma.postReaction.delete({ where: key })
        : prisma.postReaction.create({ data: { postId, userId } }),
      prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: existing ? -1 : 1 } }
      })
    ]);

    res.json({ post: updated, liked: !existing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Flag a post
app.post('/api/posts/:id/flag', authenticateJWT, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.userId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot flag your own post' });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { flagged: true }
    });
    
    res.json({ post: updated, message: 'Post flagged for review' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to flag post' });
  }
});

// Unflag a post (admin only)
app.patch('/api/posts/:id/unflag', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { flagged: false }
    });
    
    res.json({ post: updated, message: 'Post unflagged successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unflag post' });
  }
});

// Add comment to post
app.post('/api/posts/:id/comments', authenticateJWT, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: req.user.userId,
        content
      },
      include: {
        user: { select: { id: true, username: true, role: true } }
      }
    });
    
    // Return comment with public user info
    res.json({ 
      comment: {
        ...comment,
        user: getPublicUserInfo(comment.user)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update comment
app.put('/api/comments/:id', authenticateJWT, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const { content } = req.body;
    
    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) return res.status(404).json({ error: 'Comment not found' });
    
    // Only owner or admin can edit
    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: { select: { id: true, username: true, role: true } }
      }
    });
    
    // Return comment with public user info
    res.json({ 
      comment: {
        ...comment,
        user: getPublicUserInfo(comment.user)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment (soft delete)
app.delete('/api/comments/:id', authenticateJWT, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!existing) return res.status(404).json({ error: 'Comment not found' });
    
    // Check if already deleted
    if (existing.deleted) {
      return res.status(400).json({ error: 'Comment already deleted' });
    }
    
    // Only owner or admin can delete
    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Soft delete - mark as deleted instead of removing from database
    await prisma.comment.update({ 
      where: { id: commentId },
      data: { 
        deleted: true,
        deletedAt: new Date()
      }
    });
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Like/support a comment
app.post('/api/comments/:id/like', authenticateJWT, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const userId = req.user.userId;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // One like per user: liking again removes the like
    const key = { commentId_userId: { commentId, userId } };
    const existing = await prisma.commentReaction.findUnique({ where: key });
    const [, updated] = await prisma.$transaction([
      existing
        ? prisma.commentReaction.delete({ where: key })
        : prisma.commentReaction.create({ data: { commentId, userId } }),
      prisma.comment.update({
        where: { id: commentId },
        data: { likes: { increment: existing ? -1 : 1 } }
      })
    ]);

    res.json({ comment: updated, liked: !existing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Flag a comment (with safety checks)
app.post('/api/comments/:id/flag', authenticateJWT, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const { reason } = req.body;
    const userId = req.user.userId;
    
    // Check if comment exists and is not deleted
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId },
      include: { user: { select: { id: true } } }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.deleted) {
      return res.status(400).json({ error: 'Cannot flag a deleted comment' });
    }
    
    // Prevent flagging own comment
    if (comment.userId === userId) {
      return res.status(400).json({ error: 'You cannot flag your own comment' });
    }
    
    // Check if user has already flagged this comment
    const existingFlag = await prisma.commentFlag.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId
        }
      }
    });
    
    if (existingFlag) {
      return res.status(400).json({ error: 'You have already flagged this comment' });
    }
    
    // Create the flag
    const flag = await prisma.commentFlag.create({
      data: {
        commentId,
        userId,
        reason: reason || 'No reason provided'
      }
    });
    
    // Update comment flag count and flagged status
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { 
        flagCount: { increment: 1 },
        flagged: true
      }
    });
    
    res.json({ 
      message: 'Comment flagged for review',
      flag,
      flagCount: updatedComment.flagCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to flag comment' });
  }
});

// Unflag a comment (admin only)
app.patch('/api/comments/:id/unflag', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Clear flags and reset flag status
    await prisma.commentFlag.deleteMany({
      where: { commentId }
    });
    
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { 
        flagged: false,
        flagCount: 0
      }
    });
    
    res.json({ comment: updated, message: 'Comment unflagged successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unflag comment' });
  }
});

// ========== MODERATION ROUTES (Admin/Counselor Only) ==========

// Get all flagged comments (for admin dashboard)
app.get('/api/comments/flagged', authenticateJWT, requireRole('admin', 'counselor'), async (req, res) => {
  try {
    const flaggedComments = await prisma.comment.findMany({
      where: {
        flagged: true,
        deleted: false
      },
      include: {
        user: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ comments: flaggedComments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flagged comments' });
  }
});

// Get all flagged comments (detailed moderation view)
app.get('/api/moderation/flagged-comments', authenticateJWT, requireRole('admin', 'counselor'), async (req, res) => {
  try {
    const flaggedComments = await prisma.comment.findMany({
      where: {
        flagged: true,
        deleted: false
      },
      include: {
        user: { select: { id: true, username: true, role: true } },
        post: { select: { id: true, title: true } },
        flags: {
          include: {
            user: { select: { id: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { flagCount: 'desc' }
    });
    
    // Format user info - moderators see usernames
    const formattedComments = flaggedComments.map(comment => ({
      ...comment,
      user: getPublicUserInfo(comment.user),
      flags: comment.flags.map(flag => ({
        ...flag,
        user: getPublicUserInfo(flag.user)
      }))
    }));
    
    res.json({ 
      flaggedComments: formattedComments,
      total: formattedComments.length 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flagged comments' });
  }
});

// Get flags for a specific comment
app.get('/api/comments/:id/flags', authenticateJWT, requireRole('admin', 'counselor'), async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        flags: {
          include: {
            user: { select: { id: true, username: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        user: { select: { id: true, username: true, role: true } }
      }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ 
      comment: {
        id: comment.id,
        content: comment.content,
        flagCount: comment.flagCount,
        flagged: comment.flagged,
        hiddenByModerator: comment.hiddenByModerator,
        moderatorNote: comment.moderatorNote,
        author: getPublicUserInfo(comment.user)
      },
      flags: comment.flags
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comment flags' });
  }
});

// Hide a comment (moderator action)
app.post('/api/moderation/comments/:id/hide', authenticateJWT, requireRole('admin', 'counselor'), async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const { moderatorNote } = req.body;
    
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.deleted) {
      return res.status(400).json({ error: 'Cannot hide a deleted comment' });
    }
    
    if (comment.hiddenByModerator) {
      return res.status(400).json({ error: 'Comment is already hidden' });
    }
    
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        hiddenByModerator: true,
        moderatorNote: moderatorNote || 'Hidden by moderator'
      }
    });
    
    res.json({ 
      message: 'Comment hidden successfully',
      comment: {
        id: updated.id,
        hiddenByModerator: updated.hiddenByModerator,
        moderatorNote: updated.moderatorNote
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to hide comment' });
  }
});

// Unhide a comment (moderator action)
app.post('/api/moderation/comments/:id/unhide', authenticateJWT, requireRole('admin', 'counselor'), async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (!comment.hiddenByModerator) {
      return res.status(400).json({ error: 'Comment is not hidden' });
    }
    
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        hiddenByModerator: false,
        moderatorNote: null
      }
    });
    
    res.json({ 
      message: 'Comment unhidden successfully',
      comment: {
        id: updated.id,
        hiddenByModerator: updated.hiddenByModerator
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unhide comment' });
  }
});

// Clear all flags from a comment (admin only)
app.delete('/api/moderation/comments/:id/flags', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Delete all flags for this comment
    await prisma.commentFlag.deleteMany({
      where: { commentId }
    });
    
    // Update comment to clear flag status
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        flagged: false,
        flagCount: 0
      }
    });
    
    res.json({ 
      message: 'All flags cleared successfully',
      comment: {
        id: updated.id,
        flagged: updated.flagged,
        flagCount: updated.flagCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear flags' });
  }
});

// Resources API routes
// Get all resources
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ resources });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Create resource (admin only)
app.post('/api/resources', authenticateJWT, requireRole('admin'), async (req, res) => {
  const { title, url } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL required' });
  }
  try {
    const resource = await prisma.resource.create({
      data: { title, url }
    });
    res.json({ resource });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// Update resource (admin only)
app.put('/api/resources/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  const { title, url } = req.body;
  try {
    const resource = await prisma.resource.update({
      where: { id: Number(req.params.id) },
      data: { title, url }
    });
    res.json({ resource });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// Delete resource (admin only)
app.delete('/api/resources/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    await prisma.resource.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin Analytics Route
app.get('/api/analytics', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    // User statistics
    const totalUsers = await prisma.user.count();
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });
    
    // Chat statistics
    const totalChatSessions = await prisma.chatSession.count();
    const totalMessages = await prisma.message.count();
    const anonymousSessions = await prisma.chatSession.count({
      where: { userId: null }
    });
    
    // Appointment statistics
    const totalAppointments = await prisma.appointment.count();
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    // Peer support statistics
    const totalPosts = await prisma.post.count();
    const totalComments = await prisma.comment.count();
    const flaggedPosts = await prisma.post.count({
      where: { flagged: true }
    });
    const flaggedComments = await prisma.comment.count({
      where: { flagged: true }
    });
    const totalPostLikes = await prisma.post.aggregate({
      _sum: { likes: true }
    });
    const totalCommentLikes = await prisma.comment.aggregate({
      _sum: { likes: true }
    });
    
    // Analytics logs
    const totalAnalyticsLogs = await prisma.analyticsLog.count();
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });
    const recentPosts = await prisma.post.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });
    const recentAppointments = await prisma.appointment.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });
    const recentChatSessions = await prisma.chatSession.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });
    
    // Compile analytics response
    const analytics = {
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.id;
          return acc;
        }, {}),
        recentSignups: recentUsers
      },
      chat: {
        totalSessions: totalChatSessions,
        totalMessages: totalMessages,
        anonymousSessions: anonymousSessions,
        recentSessions: recentChatSessions
      },
      appointments: {
        total: totalAppointments,
        byStatus: appointmentsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        recentAppointments: recentAppointments
      },
      peerSupport: {
        totalPosts: totalPosts,
        totalComments: totalComments,
        flaggedPosts: flaggedPosts,
        flaggedComments: flaggedComments,
        totalPostLikes: totalPostLikes._sum.likes || 0,
        totalCommentLikes: totalCommentLikes._sum.likes || 0,
        recentPosts: recentPosts
      },
      logs: {
        totalAnalyticsLogs: totalAnalyticsLogs
      }
    };
    
    res.json({ analytics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express backend listening on port ${PORT}`);
});
