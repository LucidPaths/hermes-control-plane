#!/usr/bin/env bash
set -euo pipefail

# Hermes Control Plane — Start all services
# Starts hermes-agent gateway, hermes-webui, and verifies gbrain/browser-use

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_DIR="${HERMES_AGENT_DIR:-$HOME/.hermes/hermes-agent}"
WEBUI_DIR="$HOME/hermes-webui"
WEBUI_PORT="${HERMES_WEBUI_PORT:-8787}"
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"

G='\033[0;32m'; R='\033[0;31m'; Y='\033[0;33m'; X='\033[0m'
ok()   { echo -e "${G}✓${X} $1"; }
fail() { echo -e "${R}✗${X} $1"; }

# ── 1. hermes-agent gateway ────────────────────────────────────────
echo "Starting hermes-agent gateway..."

# Check if already running
GATEWAY_PID=$(pgrep -f "gateway/run.py" 2>/dev/null || true)
if [ -n "$GATEWAY_PID" ]; then
    ok "gateway already running (PID $GATEWAY_PID)"
else
    # Start via hermes CLI or directly
    if [ -f "$AGENT_DIR/venv/bin/python" ]; then
        nohup "$AGENT_DIR/venv/bin/python" "$AGENT_DIR/gateway/run.py" > /tmp/hermes-gateway.log 2>&1 &
        sleep 3
        if pgrep -f "gateway/run.py" >/dev/null 2>&1; then
            ok "gateway started"
        else
            fail "gateway failed to start — check /tmp/hermes-gateway.log"
        fi
    else
        echo "  Starting via hermes command..."
        nohup hermes gateway > /tmp/hermes-gateway.log 2>&1 &
        sleep 3
        ok "gateway starting (check: pgrep -f gateway)"
    fi
fi

# ── 2. hermes-webui ────────────────────────────────────────────────
echo "Starting hermes-webui on port $WEBUI_PORT..."

# Check if already running
if curl -sf "http://127.0.0.1:$WEBUI_PORT/health" >/dev/null 2>&1; then
    ok "webui already running at http://localhost:$WEBUI_PORT"
else
    export HERMES_WEBUI_AGENT_DIR="$AGENT_DIR"
    export HERMES_WEBUI_PORT="$WEBUI_PORT"
    export HERMES_WEBUI_HOST="127.0.0.1"
    
    cd "$WEBUI_DIR"
    nohup python3 bootstrap.py --no-browser > /tmp/hermes-webui.log 2>&1 &
    
    # Wait for health endpoint
    for i in $(seq 1 15); do
        if curl -sf "http://127.0.0.1:$WEBUI_PORT/health" >/dev/null 2>&1; then
            ok "webui running at http://localhost:$WEBUI_PORT"
            break
        fi
        sleep 1
    done
    
    if ! curl -sf "http://127.0.0.1:$WEBUI_PORT/health" >/dev/null 2>&1; then
        fail "webui failed to start — check /tmp/hermes-webui.log"
    fi
fi

# ── 3. Verify gbrain ──────────────────────────────────────────────
echo "Verifying gbrain..."
if command -v gbrain >/dev/null 2>&1; then
    DOCTOR=$(gbrain doctor 2>&1)
    if echo "$DOCTOR" | grep -q "healthy"; then
        ok "gbrain healthy"
    else
        echo -e "${Y}○${X} gbrain has warnings — run: gbrain doctor"
    fi
else
    echo -e "${Y}○${X} gbrain not in PATH — add $HOME/.bun/bin to PATH"
fi

# ── 4. Verify browser-use ─────────────────────────────────────────
echo "Verifying browser-use..."
if [ -d "$HOME/.browser-use-env" ]; then
    ok "browser-use installed at ~/.browser-use-env"
else
    echo -e "${Y}○${X} browser-use not installed — run: scripts/bootstrap.sh"
fi

# ── Summary ────────────────────────────────────────────────────────
echo ""
echo "═══ Hermes Control Plane Started ═══"
echo "  WebUI:    http://localhost:$WEBUI_PORT"
echo "  Gateway:  running on this host"
echo "  gbrain:   $(gbrain stats 2>/dev/null | grep Pages | awk '{print $2}' || echo '?') pages"
echo "  SSH tunnel from remote: ssh -N -L $WEBUI_PORT:127.0.0.1:$WEBUI_PORT user@server"