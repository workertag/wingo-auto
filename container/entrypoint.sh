#!/bin/bash
set -e

echo "=== [Container] Starting Tailscale daemon (userspace) ==="
# Running tailscaled in userspace mode so we don't need root or a TUN device mount
tailscaled --tun=userspace-networking --state=/tmp/tailscale-state &
sleep 3

echo "=== [Container] Authenticating with Tailscale ==="
# TS_AUTHKEY must be provided as an environment variable
tailscale up --authkey="${TS_AUTHKEY}" --hostname="bot-${BOT_ID}" --accept-routes

echo "=== [Container] Setting exit node: ${TS_EXIT_NODE} ==="
# TS_EXIT_NODE must be provided as an environment variable
tailscale set --exit-node="${TS_EXIT_NODE}" --exit-node-allow-lan-access=false

echo "=== [Container] Verifying IP ==="
# Verify that the traffic is actually going through the exit node
REAL_IP=$(curl -s --max-time 10 https://api.ipify.org || echo "UNKNOWN")
echo "=== [Container] Bot external IP: ${REAL_IP} ==="

echo "=== [Container] Starting Bot ==="
node /app/container-bot-runner.js
