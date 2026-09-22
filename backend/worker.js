const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const PlaywrightBot = require('./playwright-bot');
const { connection } = require('./queue');

const prisma = new PrismaClient();
const activeBots = new Map();

// We need two separate redis clients for pub/sub because a redis client in subscribe mode cannot publish
const redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const redisPublisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

console.log("🚀 Starting BullMQ Worker...");

const worker = new Worker('bot-commands', async job => {
  const { action, botId } = job.data;
  
  if (action === 'START_BOT') {
    if (activeBots.has(botId)) {
      console.log(`Bot ${botId} is already running on this worker.`);
      return;
    }
    
    // Lock it immediately to prevent race conditions
    activeBots.set(botId, 'STARTING');
    
    const botInstance = await prisma.botInstance.findUnique({
      where: { id: botId },
      include: { endpoint: true }
    });

    if (!botInstance) {
      activeBots.delete(botId);
      throw new Error(`BotInstance ${botId} not found`);
    }

    console.log(`Starting bot ${botId}...`);
    const bot = new PlaywrightBot(botInstance, redisSubscriber, redisPublisher, prisma);
    activeBots.set(botId, bot);
    
    // Run asynchronously
    bot.start()
      .catch(err => console.error(`Bot ${botId} crashed:`, err))
      .finally(() => {
        // If it stopped or crashed, remove from active memory
        if (!bot.isRunning) {
          activeBots.delete(botId);
        }
      });
  }
  
  if (action === 'STOP_BOT') {
    const bot = activeBots.get(botId);
    if (bot) {
      console.log(`Stopping bot ${botId}...`);
      await bot.stop();
      activeBots.delete(botId);
    } else {
      console.log(`Bot ${botId} not found on this worker. Forcing DB status to STOPPED.`);
      await prisma.botInstance.update({
        where: { id: botId },
        data: { status: 'STOPPED' }
      }).catch(() => {});
    }
  }

  if (action === 'UPDATE_SETTINGS') {
    const bot = activeBots.get(botId);
    if (bot && typeof bot !== 'string') {
      console.log(`Updating settings dynamically for running bot ${botId}...`);
      bot.settings = job.data.settings;
    }
  }

  if (action === 'CANCEL_DEPOSIT') {
    const bot = activeBots.get(botId);
    if (bot && typeof bot !== 'string') {
      console.log(`Cancelling deposit flow for bot ${botId}...`);
      bot.cancelDepositFlag = true;
    }
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});

console.log("✅ Worker listening for jobs...");
