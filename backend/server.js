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

// Redis for SSE and General Commands
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
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
  try {
    const { userId, name, endpointId, wingoPhone, wingoPassword } = req.body;
    const wingoPasswordAuth = encrypt(wingoPassword);
    
    const bot = await prisma.botInstance.create({
      data: { 
        userId, 
        name, 
        endpointId: endpointId || null, 
        wingoPhone, 
        wingoPasswordAuth 
      }
    });
    res.json(bot);
  } catch (err) {
    console.error('Error creating bot:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bots/:id', authenticateToken, async (req, res) => {
  try {
    const bot = await prisma.botInstance.findUnique({
      where: { id: req.params.id },
      include: { endpoint: true }
    });
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bots/:id/settings', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;
    const bot = await prisma.botInstance.update({
      where: { id: req.params.id },
      data: { settings }
    });
    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================= DATA FETCHING =======================
app.get('/api/bots/:id/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await redisClient.lrange(`wingo:logs:${req.params.id}`, 0, 99);
    // logs are strings, parse them
    res.json(logs.map(l => JSON.parse(l)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bots/:id/history', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.betRecord.findMany({
      where: { botInstanceId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// --- TIME SLOTS ---
app.get('/api/time-slots', authenticateToken, async (req, res) => {
  const timeSlots = await prisma.timeSlot.findMany();
  res.json(timeSlots);
});
app.post('/api/time-slots', authenticateToken, async (req, res) => {
  const ts = await prisma.timeSlot.create({ data: req.body });
  res.json(ts);
});
app.put('/api/time-slots/:id', authenticateToken, async (req, res) => {
  const ts = await prisma.timeSlot.update({ where: { id: req.params.id }, data: req.body });
  res.json(ts);
});
app.delete('/api/time-slots/:id', authenticateToken, async (req, res) => {
  await prisma.timeSlot.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- STRATEGIES ---
app.get('/api/strategies', authenticateToken, async (req, res) => {
  const strategies = await prisma.strategy.findMany();
  res.json(strategies);
});
app.post('/api/strategies', authenticateToken, async (req, res) => {
  const st = await prisma.strategy.create({ data: req.body });
  res.json(st);
});
app.put('/api/strategies/:id', authenticateToken, async (req, res) => {
  const st = await prisma.strategy.update({ where: { id: req.params.id }, data: req.body });
  res.json(st);
});
app.delete('/api/strategies/:id', authenticateToken, async (req, res) => {
  await prisma.strategy.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- ENDPOINTS (PROXIES) ---
app.get('/api/endpoints', authenticateToken, async (req, res) => {
  const endpoints = await prisma.endpoint.findMany();
  res.json(endpoints);
});
app.post('/api/endpoints', authenticateToken, async (req, res) => {
  const ep = await prisma.endpoint.create({ data: req.body });
  res.json(ep);
});
app.put('/api/endpoints/:id', authenticateToken, async (req, res) => {
  const ep = await prisma.endpoint.update({ where: { id: req.params.id }, data: req.body });
  res.json(ep);
});
app.delete('/api/endpoints/:id', authenticateToken, async (req, res) => {
  await prisma.endpoint.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

const server = app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
