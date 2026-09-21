const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const { botCommandQueue } = require('./queue');
const PredictionService = require('./prediction-service');
const { encrypt } = require('./crypto');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'wingo-super-secret-key';

// Start Prediction Service on the API node
const predictionService = new PredictionService();
predictionService.start();

// Redis for SSE
const redisSSE = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redisSSE.subscribe('bot-events');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ======================= AUTH =======================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    // Fallback for old hardcoded admin during transition
    if (password === (process.env.DASHBOARD_PASSWORD || 'admin123')) {
      return res.json({ token: jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' }) });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ======================= SSE STREAM =======================
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onMessage = (channel, message) => {
    if (channel === 'bot-events') {
      res.write(`data: ${message}\n\n`);
    }
  };

  redisSSE.on('message', onMessage);

  req.on('close', () => {
    redisSSE.off('message', onMessage);
  });
});

// ======================= CRUD =======================
app.get('/api/endpoints', authenticateToken, async (req, res) => {
  const endpoints = await prisma.networkEndpoint.findMany();
  res.json(endpoints);
});

app.post('/api/endpoints', authenticateToken, async (req, res) => {
  const { userId, name, host, port, proxyUser, proxyPass } = req.body;
  const endpoint = await prisma.networkEndpoint.create({
    data: { userId, name, host, port: Number(port), proxyUser, proxyPass }
  });
  res.json(endpoint);
});

app.get('/api/bots', authenticateToken, async (req, res) => {
  const bots = await prisma.botInstance.findMany({ include: { endpoint: true } });
  res.json(bots);
});

app.post('/api/bots', authenticateToken, async (req, res) => {
  const { userId, name, endpointId, wingoPhone, wingoPassword } = req.body;
  const wingoPasswordAuth = encrypt(wingoPassword);
  
  const bot = await prisma.botInstance.create({
    data: { userId, name, endpointId, wingoPhone, wingoPasswordAuth }
  });
  res.json(bot);
});

// ======================= COMMANDS =======================
app.post('/api/bots/:id/start', authenticateToken, async (req, res) => {
  const botId = req.params.id;
  await botCommandQueue.add('start-bot', { action: 'START_BOT', botId });
  res.json({ success: true, message: 'Bot start command queued' });
});

app.post('/api/bots/:id/stop', authenticateToken, async (req, res) => {
  const botId = req.params.id;
  await botCommandQueue.add('stop-bot', { action: 'STOP_BOT', botId });
  res.json({ success: true, message: 'Bot stop command queued' });
});

// Existing config routes (time-slots, strategies) should be updated to link to BotInstance
// Kept simple here to demonstrate architecture migration

const server = app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
