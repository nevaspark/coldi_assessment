#!/usr/bin/env bash
set -euo pipefail

# Kill any process listening on port 5001 (Linux/macOS)
PORT=5001
PID_LIST=$(lsof -t -i :${PORT} -sTCP:LISTEN -Pn || true)
if [ -n "${PID_LIST}" ]; then
  echo "Killing processes on port ${PORT}: ${PID_LIST}"
  # Try graceful kill first
  kill ${PID_LIST} || true
  sleep 0.3
  # Force kill if still present
  PID_LIST=$(lsof -t -i :${PORT} -sTCP:LISTEN -Pn || true)
  if [ -n "${PID_LIST}" ]; then
    echo "Force killing processes: ${PID_LIST}"
    kill -9 ${PID_LIST} || true
  fi
fi

echo "Starting backend..."
node --watch src/index.js
