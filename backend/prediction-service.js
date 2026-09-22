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

  publishState(apiState) {
    const currentIssue = apiState.pending?.issue || apiState.issue;
    if (currentIssue && currentIssue !== this.lastSeenIssue) {
      this.lastSeenIssue = currentIssue;
      this.redisClient.publish('wingo:predictions', JSON.stringify(apiState));
    }
  }

  connectWebSocket() {
    console.log("🔌 PredictionService: Connecting to prediction WebSocket...");
    this.ws = new WebSocket(WS_URL);

    this.ws.on("open", () => {
      console.log("🟢 PredictionService: WebSocket connected to prediction engine!");
      this.startFallbackPolling();
    });

    this.ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "new_result") {
          console.log(`📨 PredictionService: new_result for issue ${msg.issue}`);
          
          setTimeout(() => {
            const https = require('https');
            const url = `https://wingo.yl.n3y.in/api/state?timer=30S`;
            https.get(url, (res) => {
              let stateData = "";
              res.on("data", (chunk) => (stateData += chunk));
              res.on("end", () => {
                try {
                  const apiState = JSON.parse(stateData);
                  this.publishState(apiState);
                } catch(e) {
                  console.error(`⚠️ PredictionService: Error parsing state API response: ${e.message}`);
                }
              });
            }).on("error", (e) => {
              console.error(`⚠️ PredictionService: Error fetching state API: ${e.message}`);
            });
          }, 2000);
        }
      } catch (err) {
        console.error(`⚠️ PredictionService: WS message parse error: ${err.message}`);
      }
    });

    this.ws.on("close", () => {
      console.log("🔴 PredictionService: WebSocket disconnected. Reconnecting in 5s...");
      this.stopFallbackPolling();
      this.reconnect();
    });

    this.ws.on("error", (err) => {
      console.error(`🔴 PredictionService WS error: ${err.message}`);
      this.stopFallbackPolling();
      this.reconnect();
    });
  }

  startFallbackPolling() {
    if (this.pollInterval) return;
    console.log("⏱️ Starting fallback polling (5s)...");
    this.lastSeenIssue = null;
    this.pollInterval = setInterval(() => {
      const https = require('https');
      https.get(`https://wingo.yl.n3y.in/api/state?timer=30S`, (res) => {
        let stateData = "";
        res.on("data", (chunk) => (stateData += chunk));
        res.on("end", () => {
          try {
            const apiState = JSON.parse(stateData);
            this.publishState(apiState);
          } catch(e) {}
        });
      }).on("error", () => {});
    }, 5000);
  }

  stopFallbackPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  reconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => this.connectWebSocket(), 5000);
  }
}

module.exports = PredictionService;
