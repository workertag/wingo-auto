const WebSocket = require('ws');
const Redis = require('ioredis');

const WS_URL = "wss://wingo.yl.n3y.in/api/ws?timer=30S";

class PredictionService {
  constructor(redisUrl) {
    this.redisClient = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.ws = null;
    this.reconnectTimeout = null;
  }

  start() {
    this.connectWebSocket();
    console.log("🚀 PredictionService initialized.");
  }

  connectWebSocket() {
    console.log("🔌 PredictionService: Connecting to prediction WebSocket...");
    this.ws = new WebSocket(WS_URL);

    this.ws.on("open", () => {
      console.log("🟢 PredictionService: WebSocket connected to prediction engine!");
    });

    this.ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "new_result") {
          console.log(`📨 PredictionService: new_result for issue ${msg.issue}`);
          // Publish to Redis so all workers receive it
          this.redisClient.publish('wingo:predictions', JSON.stringify(msg));
        }
      } catch (err) {
        console.error(`⚠️ PredictionService: WS message parse error: ${err.message}`);
      }
    });

    this.ws.on("close", () => {
      console.log("🔴 PredictionService: WebSocket disconnected. Reconnecting in 5s...");
      this.reconnect();
    });

    this.ws.on("error", (err) => {
      console.error(`⚠️ PredictionService: WebSocket error: ${err.message}`);
    });
  }

  reconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => this.connectWebSocket(), 5000);
  }
}

module.exports = PredictionService;
