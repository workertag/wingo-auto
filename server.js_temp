const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'wingo-super-secret-key';

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const STRATEGY_FILE = path.join(ROOT_DIR, 'backend-strategy.json');
const BOT_SCRIPT = path.join(ROOT_DIR, 'backend-bot.js');

// Bot Process State
let botProcess = null;
let botLogs = [];
const MAX_LOG_LINES = 200;

let botStats = {
  totalWins: 0,
  totalLosses: 0,
  totalEarned: 0,
  currentBalance: null,
  history: [],
  depositState: { status: 'IDLE', address: null, failed: false }
};

// Middleware to protect routes
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

// ======================= AUTH API =======================
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === DASHBOARD_PASSWORD) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// ======================= TIME SLOTS API =======================
app.get('/api/time-slots', authenticateToken, async (req, res) => {
  try {
    const timeSlots = await prisma.timeSlot.findMany();
    res.json(timeSlots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

app.post('/api/time-slots', authenticateToken, async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;
    const timeSlot = await prisma.timeSlot.create({
      data: { name, startTime, endTime }
    });
    res.json(timeSlot);
  } catch (err) {
    console.error('Failed to create time slot:', err);
    res.status(500).json({ error: 'Failed to create time slot: ' + err.message });
  }
});

app.put('/api/time-slots/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime } = req.body;
    const timeSlot = await prisma.timeSlot.update({
      where: { id },
      data: { name, startTime, endTime }
    });
    res.json(timeSlot);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update time slot' });
  }
});

app.delete('/api/time-slots/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.timeSlot.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete time slot' });
  }
});

// ======================= STRATEGIES API =======================
app.get('/api/strategies', authenticateToken, async (req, res) => {
  try {
    const strategies = await prisma.strategy.findMany();
    res.json(strategies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

app.post('/api/strategies', authenticateToken, async (req, res) => {
  try {
    const { name, minLevel, maxLevel, maxWins, maxLosses, levels, config } = req.body;
    const strategy = await prisma.strategy.create({
      data: { name, minLevel, maxLevel, maxWins, maxLosses, levels, config }
    });
    res.json(strategy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create strategy' });
  }
});

app.put('/api/strategies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, minLevel, maxLevel, maxWins, maxLosses, levels, config } = req.body;
    const strategy = await prisma.strategy.update({
      where: { id },
      data: { name, minLevel, maxLevel, maxWins, maxLosses, levels, config }
    });
    res.json(strategy);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update strategy' });
  }
});

app.delete('/api/strategies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.strategy.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete strategy' });
  }
});

// ===================== SETTINGS API =====================
app.get('/api/settings', authenticateToken, (req, res) => {
  try {
    const strategyData = JSON.parse(fs.readFileSync(STRATEGY_FILE, 'utf8'));
    res.json({
      strategy: strategyData,
      credentials: {
        phone: process.env.WINGO_PHONE || '',
        password: process.env.WINGO_PASSWORD || ''
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read strategy file' });
  }
});

app.post('/api/settings', authenticateToken, (req, res) => {
  try {
    const { strategy, credentials } = req.body;
    
    // Update strategy.json
    if (strategy) {
      fs.writeFileSync(STRATEGY_FILE, JSON.stringify(strategy, null, 2));
    }
    
    // Update .env for credentials
    if (credentials) {
      const envContent = `WINGO_PHONE=${credentials.phone}\nWINGO_PASSWORD=${credentials.password}\nDASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}\nJWT_SECRET=${JWT_SECRET}`;
      fs.writeFileSync(path.join(__dirname, '.env'), envContent);
      // Update running process env too
      process.env.WINGO_PHONE = credentials.phone;
      process.env.WINGO_PASSWORD = credentials.password;
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ======================== BOT API =======================
app.get('/api/bot/status', authenticateToken, (req, res) => {
  res.json({ running: !!botProcess });
});

app.post('/api/bot/start', authenticateToken, (req, res) => {
  if (botProcess) {
    return res.status(400).json({ error: 'Bot is already running' });
  }

  const { schedules, globalOptions } = req.body;
  console.log('Received startBot request with globalOptions:', globalOptions);

  botLogs = [];
  
  const logLine = `[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }).replace(',', '')} IST] 🛠️ Backend received start: ${JSON.stringify(req.body)}`;
  botLogs.push(logLine);
  if (botLogs.length > MAX_LOG_LINES) botLogs.shift();

  botStats = {
    totalWins: 0,
    totalLosses: 0,
    totalEarned: 0,
    currentBalance: null,
    history: [],
    depositState: { status: 'IDLE', address: null, failed: false }
  };
  
  // Pass credentials via environment variables
  const botEnv = Object.assign({}, process.env, {
    WINGO_PHONE: process.env.WINGO_PHONE,
    WINGO_PASSWORD: process.env.WINGO_PASSWORD,
    ACTIVE_SCHEDULES: JSON.stringify(schedules || []),
    GLOBAL_OPTIONS: JSON.stringify(globalOptions || {})
  });

  botProcess = spawn('node', [BOT_SCRIPT], { 
    cwd: ROOT_DIR,
    env: botEnv,
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  });

  const handleLog = (data) => {
    const str = data.toString();
    const lines = str.split('\n').filter(l => l.trim() !== '');
    botLogs.push(...lines);
    if (botLogs.length > MAX_LOG_LINES) {
      botLogs = botLogs.slice(botLogs.length - MAX_LOG_LINES);
    }
  };

  botProcess.stdout.on('data', handleLog);
  botProcess.stderr.on('data', handleLog);

  botProcess.on('message', (msg) => {
    if (msg.type === 'ROUND_RESULT') {
      const { issue, betType, betQuantity, won, amount } = msg.data;
      if (won) {
        botStats.totalWins += 1;
        botStats.totalEarned += amount;
      } else {
        botStats.totalLosses += 1;
        botStats.totalEarned += amount;
      }
      botStats.history.unshift({ issue, betType, betQuantity, won, amount, timestamp: new Date().toISOString() });
      if (botStats.history.length > 50) {
        botStats.history.pop();
      }
    } else if (msg.type === 'BALANCE_UPDATE') {
      botStats.currentBalance = msg.data.balance;
    } else if (msg.type === 'DEPOSIT_UPDATE') {
      botStats.depositState = { ...botStats.depositState, ...msg.data };
    }
  });

  botProcess.on('close', (code) => {
    botLogs.push(`[SYSTEM] Bot stopped with exit code ${code}`);
    botProcess = null;
  });

  res.json({ success: true, message: 'Bot started' });
});

// ======================= BOT SESSIONS API =======================
app.get('/api/bot-sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.botSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.post('/api/bot/stop', authenticateToken, (req, res) => {
  if (!botProcess) {
    return res.status(400).json({ error: 'Bot is not running' });
  }
  
  // Send SIGINT to gracefully close browsers
  botProcess.kill('SIGINT');
  
  res.json({ success: true, message: 'Stop signal sent' });
});

app.post('/api/bot/options', authenticateToken, (req, res) => {
  if (botProcess) {
    botProcess.send({ type: 'UPDATE_OPTIONS', data: req.body });
  }
  res.json({ success: true });
});

app.get('/api/bot/logs', authenticateToken, (req, res) => {
  res.json({ logs: botLogs });
});

app.get('/api/bot/stats', authenticateToken, (req, res) => {
  res.json(botStats);
});

app.post('/api/bot/retry-deposit', authenticateToken, (req, res) => {
  if (botProcess) {
    botStats.depositState = { status: 'IDLE', address: null, failed: false };
    botProcess.send({ type: 'RETRY_DEPOSIT' });
  }
  res.json({ success: true });
});

const server = app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`Run: kill $(lsof -ti:${PORT}) to free it.\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
