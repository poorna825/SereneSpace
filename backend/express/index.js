import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Crisis keywords for detection
const CRISIS_KEYWORDS = [
  'suicide', 'self-harm', 'kill myself', 'end my life', 'hurt myself',
  'overdose', 'cutting', 'depressed', 'hopeless', 'can\'t go on', 'give up'
];

// HuggingFace Inference API config
const HF_API_URL = 'https://api-inference.huggingface.co/models/gpt2';
const HF_API_KEY = process.env.HF_API_KEY || 'your_huggingface_api_key';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Express backend running!' });
});

// User registration
app.post('/api/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    });
    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'User registration failed', details: err.message });
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
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
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
    res.json({ user: { id: user.id, email: user.email, role: user.role } });
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

// Chatbot API route
app.post('/api/chatbot', authenticateJWT, async (req, res) => {
  const { message, anonymous, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  // Detect crisis keywords
  const crisis = CRISIS_KEYWORDS.some(kw => message.toLowerCase().includes(kw));

  // Call HuggingFace Inference API
  let botReply = '';
  try {
    const hfRes = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: message })
    });
    const hfData = await hfRes.json();
    botReply = Array.isArray(hfData) && hfData[0]?.generated_text ? hfData[0].generated_text : (hfData.generated_text || '');
  } catch (err) {
    botReply = 'Sorry, I am having trouble responding right now.';
  }

  // Store chat history in DB
  let chatSession;
  try {
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    }
    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: anonymous ? null : req.user.userId,
        },
      });
    }
    // Store user message
    await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        sender: anonymous ? 'anonymous' : req.user.email,
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

  res.json({ reply: botReply, crisis, sessionId: chatSession?.id });
});

// User CRUD endpoints (protected)
app.get('/api/users', authenticateJWT, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

app.get('/api/users/:id', authenticateJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, email: true, role: true, createdAt: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
});

app.put('/api/users/:id', authenticateJWT, async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { email, role } });
    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
});

app.delete('/api/users/:id', authenticateJWT, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});

// Appointment/Booking System API routes
// Create appointment
app.post('/api/appointments', authenticateJWT, async (req, res) => {
  const { counselorId, scheduledAt } = req.body;
  if (!counselorId || !scheduledAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user.userId,
        counselorId: Number(counselorId),
        scheduledAt: new Date(scheduledAt),
        status: 'pending'
      }
    });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create appointment', details: err.message });
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
    
    // If user is not admin/counselor, only show their own appointments
    if (req.user.role === 'user') {
      where.userId = req.user.userId;
    }
    
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, role: true } },
        counselor: { select: { id: true, email: true, role: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: err.message });
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
        user: { select: { id: true, email: true, role: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch counselor appointments', details: err.message });
  }
});

// Get specific appointment
app.get('/api/appointments/:id', authenticateJWT, async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, email: true, role: true } },
        counselor: { select: { id: true, email: true, role: true } }
      }
    });
    
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    
    // Check access rights
    if (req.user.role === 'user' && appointment.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointment', details: err.message });
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
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (status) updateData.status = status;
    if (counselorId) updateData.counselorId = Number(counselorId);
    
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, role: true } },
        counselor: { select: { id: true, email: true, role: true } }
      }
    });
    
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment', details: err.message });
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
    res.status(500).json({ error: 'Failed to delete appointment', details: err.message });
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
        user: { select: { id: true, email: true, role: true } }
      }
    });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post', details: err.message });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const { flagged } = req.query;
    const where = {};
    
    // Only show flagged posts to admins/counselors
    if (flagged === 'true') {
      where.flagged = true;
    } else {
      where.flagged = false; // Default: hide flagged posts
    }
    
    const posts = await prisma.post.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, role: true } },
        comments: {
          include: {
            user: { select: { id: true, email: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts', details: err.message });
  }
});

// Get specific post with comments
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, email: true, role: true } },
        comments: {
          include: {
            user: { select: { id: true, email: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post', details: err.message });
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
        user: { select: { id: true, email: true, role: true } }
      }
    });
    
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post', details: err.message });
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
    res.status(500).json({ error: 'Failed to delete post', details: err.message });
  }
});

// Like/support a post
app.post('/api/posts/:id/like', authenticateJWT, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { likes: post.likes + 1 }
    });
    
    res.json({ post: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post', details: err.message });
  }
});

// Flag a post
app.post('/api/posts/:id/flag', authenticateJWT, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { flagged: true }
    });
    
    res.json({ post: updated, message: 'Post flagged for review' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to flag post', details: err.message });
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
        user: { select: { id: true, email: true, role: true } }
      }
    });
    
    res.json({ comment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment', details: err.message });
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
        user: { select: { id: true, email: true, role: true } }
      }
    });
    
    res.json({ comment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update comment', details: err.message });
  }
});

// Delete comment
app.delete('/api/comments/:id', authenticateJWT, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const existing = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!existing) return res.status(404).json({ error: 'Comment not found' });
    
    // Only owner or admin can delete
    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment', details: err.message });
  }
});

// Like/support a comment
app.post('/api/comments/:id/like', authenticateJWT, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { likes: comment.likes + 1 }
    });
    
    res.json({ comment: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like comment', details: err.message });
  }
});

// Flag a comment
app.post('/api/comments/:id/flag', authenticateJWT, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { flagged: true }
    });
    
    res.json({ comment: updated, message: 'Comment flagged for review' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to flag comment', details: err.message });
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
    res.status(500).json({ error: 'Failed to fetch resources', details: err.message });
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
    res.status(500).json({ error: 'Failed to create resource', details: err.message });
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
    res.status(500).json({ error: 'Failed to update resource', details: err.message });
  }
});

// Delete resource (admin only)
app.delete('/api/resources/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    await prisma.resource.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resource', details: err.message });
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
    res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express backend listening on port ${PORT}`);
});
