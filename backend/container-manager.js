const { execSync } = require('child_process');

class ContainerManager {
  /**
   * Start a bot inside a Podman container
   * @param {Object} options
   * @param {string} options.botId - The BotInstance ID
   * @param {string} options.tailscaleAuthKey - Ephemeral TS auth key
   * @param {string} options.exitNodeIP - Tailscale exit node IP
   * @param {string} options.redisUrl - Redis connection URL
   * @param {string} options.databaseUrl - PostgreSQL connection URL
   * @returns {string} containerId
   */
  static start({ botId, tailscaleAuthKey, exitNodeIP, redisUrl, databaseUrl }) {
    const containerName = `wingo-bot-${botId.substring(0, 8)}`;

    // Kill any existing container with the same name
    try {
      execSync(`podman rm -f ${containerName} 2>/dev/null`, { stdio: 'ignore' });
    } catch (e) { /* Container didn't exist, that's fine */ }

    const cmd = [
      'podman run -d',
      `--name ${containerName}`,
      '--cap-add=NET_ADMIN',     // Needed for Tailscale networking
      '--device=/dev/net/tun',    // TUN device for Tailscale (if not userspace)
      `--memory=600m`,            // Limit RAM per container
      `--cpus=0.5`,               // Limit CPU per container
      `-e BOT_ID=${botId}`,
      `-e TS_AUTHKEY=${tailscaleAuthKey}`,
      `-e TS_EXIT_NODE=${exitNodeIP}`,
      `-e REDIS_URL=${redisUrl}`,
      `-e DATABASE_URL=${databaseUrl}`,
      'wingo-bot:latest'
    ].join(' ');

    const containerId = execSync(cmd).toString().trim();
    console.log(`Container started: ${containerName} (${containerId.substring(0, 12)})`);
    return containerId;
  }

  /**
   * Stop and remove a bot container
   */
  static stop(botId) {
    const containerName = `wingo-bot-${botId.substring(0, 8)}`;
    try {
      execSync(`podman stop ${containerName}`, { timeout: 15000 });
      execSync(`podman rm ${containerName}`, { timeout: 5000 });
      console.log(`Container stopped: ${containerName}`);
    } catch (e) {
      console.error(`Failed to stop container ${containerName}: ${e.message}`);
      // Force kill
      try { execSync(`podman rm -f ${containerName}`); } catch (e2) { }
    }
  }

  /**
   * Get logs from a running container
   */
  static getLogs(botId, tail = 50) {
    const containerName = `wingo-bot-${botId.substring(0, 8)}`;
    try {
      return execSync(`podman logs --tail ${tail} ${containerName}`).toString();
    } catch (e) {
      return '';
    }
  }

  /**
   * Check if a container is running
   */
  static isRunning(botId) {
    const containerName = `wingo-bot-${botId.substring(0, 8)}`;
    try {
      const status = execSync(`podman inspect --format '{{.State.Status}}' ${containerName}`).toString().trim();
      return status === 'running';
    } catch (e) {
      return false;
    }
  }

  /**
   * List all running wingo-bot containers
   */
  static listRunning() {
    try {
      const output = execSync('podman ps --filter name=wingo-bot --format "{{.Names}} {{.Status}}"').toString();
      return output.trim().split('\n').filter(Boolean);
    } catch (e) {
      return [];
    }
  }
}

module.exports = ContainerManager;
