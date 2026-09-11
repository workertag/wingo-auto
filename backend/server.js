const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

  // Clear logs
  botLogs = [];
  
  // Pass credentials via environment variables
  const botEnv = Object.assign({}, process.env, {
    WINGO_PHONE: process.env.WINGO_PHONE,
    WINGO_PASSWORD: process.env.WINGO_PASSWORD
  });

  botProcess = spawn('node', [BOT_SCRIPT], { 
    cwd: ROOT_DIR,
    env: botEnv
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

  botProcess.on('close', (code) => {
    botLogs.push(`[SYSTEM] Bot stopped with exit code ${code}`);
    botProcess = null;
  });

  res.json({ success: true, message: 'Bot started' });
});

app.post('/api/bot/stop', authenticateToken, (req, res) => {
  if (!botProcess) {
    return res.status(400).json({ error: 'Bot is not running' });
  }
  
  // Send SIGINT to gracefully close browsers
  botProcess.kill('SIGINT');
  
  res.json({ success: true, message: 'Stop signal sent' });
});

app.get('/api/bot/logs', authenticateToken, (req, res) => {
  res.json({ logs: botLogs });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
