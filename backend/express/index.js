
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express backend listening on port ${PORT}`);
});
