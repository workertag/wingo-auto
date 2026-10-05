const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const ContainerManager = require('./container-manager');
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
    
    activeBots.set(botId, 'STARTING');
    
    const botInstance = await prisma.botInstance.findUnique({
      where: { id: botId },
      include: { endpoint: true }
    });

    if (!botInstance) {
      activeBots.delete(botId);
      throw new Error(`BotInstance ${botId} not found`);
    }
    
    const endpoint = botInstance.endpoint;
    
    // We can still support regular proxies for testing without containers,
    // but the target is Tailscale via containers.
    if (!endpoint || endpoint.type !== 'TAILSCALE') {
       console.warn(`Bot ${botId} does not have a TAILSCALE endpoint. The container might start but not use a specific exit node.`);
    }

    console.log(`Starting container for bot ${botId}...`);
    try {
      const containerId = ContainerManager.start({
        botId,
        tailscaleAuthKey: endpoint?.tailscaleAuthKey || '',
        exitNodeIP: endpoint?.tailscaleExitNodeIP || '',
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
        databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wingo_automation'
      });
      
      activeBots.set(botId, containerId); // store containerId instead of object
      await prisma.botInstance.update({
        where: { id: botId },
        data: { status: 'RUNNING', containerId }
      });
    } catch (e) {
      console.error(`Failed to start container for bot ${botId}`, e);
      activeBots.delete(botId);
    }
  }
  
  if (action === 'STOP_BOT') {
    console.log(`Stopping container for bot ${botId}...`);
    ContainerManager.stop(botId);
    activeBots.delete(botId);
    
    await prisma.botInstance.update({
      where: { id: botId },
      data: { status: 'STOPPED', containerId: null }
    }).catch(() => {});
  }

  if (action === 'UPDATE_SETTINGS') {
    console.log(`Forwarding UPDATE_SETTINGS to container ${botId}...`);
    redisPublisher.publish(`bot:${botId}:commands`, JSON.stringify({
      action: 'UPDATE_SETTINGS',
      settings: job.data.settings
    }));
  }

  if (action === 'CANCEL_DEPOSIT') {
    console.log(`Forwarding CANCEL_DEPOSIT to container ${botId}...`);
    redisPublisher.publish(`bot:${botId}:commands`, JSON.stringify({
      action: 'CANCEL_DEPOSIT'
    }));
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});

console.log("✅ Worker listening for jobs...");
