const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const PlaywrightBot = require('./playwright-bot');

const prisma = new PrismaClient();
// We use the REDIS_URL passed from the worker
const redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const redisPublisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function main() {
  console.log(`Starting container runner for bot: ${process.env.BOT_ID}`);
  const botInstance = await prisma.botInstance.findUnique({
    where: { id: process.env.BOT_ID },
    include: { endpoint: true }
  });

  if (!botInstance) {
    console.error(`Bot ${process.env.BOT_ID} not found in DB`);
    process.exit(1);
  }

  // Override proxy settings — Tailscale handles networking at the OS level.
  // The bot should NOT set any Playwright proxy; all traffic is already
  // forced through the Tailscale exit node.
  botInstance.endpoint = { ...botInstance.endpoint, type: 'TAILSCALE' };

  const bot = new PlaywrightBot(botInstance, redisSubscriber, redisPublisher, prisma);

  // Listen for commands like UPDATE_SETTINGS or CANCEL_DEPOSIT sent from the main server
  const commandSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  commandSub.subscribe(`bot:${process.env.BOT_ID}:commands`);
  commandSub.on('message', (channel, message) => {
    try {
      const cmd = JSON.parse(message);
      if (cmd.action === 'UPDATE_SETTINGS') {
        console.log("Dynamically updating settings via pub/sub");
        bot.settings = cmd.settings;
      }
      if (cmd.action === 'CANCEL_DEPOSIT') {
        console.log("Cancelling deposit via pub/sub");
        bot.cancelDepositFlag = true;
      }
    } catch (e) {
      console.error("Failed to parse incoming command message", e);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, stopping bot gracefully...');
    await bot.stop();
    process.exit(0);
  });

  await bot.start();
}

main().catch(err => {
  console.error('Bot runner crashed:', err);
  process.exit(1);
});
