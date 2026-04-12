#!/usr/bin/env bash
set -euo pipefail

# Hermes Control Plane — Stop all services

WEBUI_PORT="${HERMES_WEBUI_PORT:-8787}"

echo "Stopping hermes-webui..."
WEBUI_PID=$(lsof -ti :$WEBUI_PORT 2>/dev/null || true)
if [ -n "$WEBUI_PID" ]; then
    kill $WEBUI_PID 2>/dev/null || true
    echo "  Stopped webui (PID $WEBUI_PID)"
else
    echo "  WebUI not running"
fi

echo "Stopping hermes-agent gateway..."
GATEWAY_PID=$(pgrep -f "gateway/run.py" 2>/dev/null || true)
if [ -n "$GATEWAY_PID" ]; then
    kill $GATEWAY_PID 2>/dev/null || true
    echo "  Stopped gateway (PID $GATEWAY_PID)"
else
    echo "  Gateway not running"
fi

echo "Done. gbrain and browser-use are on-demand — no persistent process to stop."