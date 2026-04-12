#!/usr/bin/env bash
set -euo pipefail

# Hermes Control Plane — Status check
# Shows health of all components at a glance

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"
WEBUI_PORT="${HERMES_WEBUI_PORT:-8787}"

G='\033[0;32m'; R='\033[0;31m'; Y='\033[0;33m'; X='\033[0m'
ok()   { echo -e "  ${G}✓${X} $1"; }
fail() { echo -e "  ${R}✗${X} $1"; }
warn() { echo -e "  ${Y}○${X} $1"; }

echo "═══ Hermes Control Plane Status ═══"
echo ""

# ── 1. hermes-agent gateway ────────────────────────────────────────
echo "hermes-agent gateway:"
GATEWAY_PID=$(pgrep -f "gateway/run.py" 2>/dev/null || true)
if [ -n "$GATEWAY_PID" ]; then
    ok "running (PID $GATEWAY_PID)"
else
    fail "not running — start: scripts/start.sh"
fi

# ── 2. hermes-webui ────────────────────────────────────────────────
echo "hermes-webui:"
HEALTH=$(curl -sf "http://127.0.0.1:$WEBUI_PORT/health" 2>/dev/null || echo "")
if [ -n "$HEALTH" ]; then
    STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'ok, uptime={d.get(\"uptime_seconds\",0):.0f}s, sessions={d.get(\"sessions\",0)}')" 2>/dev/null || echo "ok")
    ok "$STATUS at http://localhost:$WEBUI_PORT"
else
    fail "not responding on port $WEBUI_PORT — start: scripts/start.sh"
fi

# ── 3. gbrain ──────────────────────────────────────────────────────
echo "gbrain:"
if command -v gbrain >/dev/null 2>&1; then
    STATS=$(gbrain stats 2>&1)
    PAGES=$(echo "$STATS" | grep "Pages:" | awk '{print $2}')
    EMBEDDED=$(echo "$STATS" | grep "Embedded:" | awk '{print $2}')
    DOCTOR=$(gbrain doctor --json 2>&1 || echo "{}")
    STATUS=$(echo "$DOCTOR" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "unknown")
    
    if [ "$STATUS" = "healthy" ]; then
        ok "healthy — $PAGES pages, $EMBEDDED embedded"
    else
        warn "status=$STATUS — $PAGES pages, $EMBEDDED embedded (run: gbrain doctor)"
    fi
else
    fail "gbrain not in PATH — add ~/.bun/bin to PATH or run: scripts/bootstrap.sh"
fi

# ── 4. self-evolution ──────────────────────────────────────────────
echo "self-evolution:"
if [ -d "$REPO_ROOT/upstream/self-evolution" ]; then
    ok "vendored at $REPO_ROOT/upstream/self-evolution"
    # Check if installed in venv
    if [ -f "$HOME/.hermes/hermes-agent/venv/bin/python" ]; then
        RESULT=$("$HOME/.hermes/hermes-agent/venv/bin/python" -c "import evolution; print('ok')" 2>&1 || echo "fail")
        if [ "$RESULT" = "ok" ]; then
            ok "installed in hermes-agent venv"
        else
            warn "not installed in venv — run: uv pip install -e $REPO_ROOT/upstream/self-evolution[dev]"
        fi
    fi
else
    fail "not cloned — run: scripts/bootstrap.sh"
fi

# ── 5. browser-use ─────────────────────────────────────────────────
echo "browser-use:"
if [ -d "$HOME/.browser-use-env" ]; then
    ok "CLI installed at ~/.browser-use-env"
    # Check hermes browser config
    if grep -q "cloud_provider: browser-use" ~/.hermes/config.yaml 2>/dev/null; then
        ok "cloud provider configured in hermes-agent"
    else
        warn "using local Chromium (cloud: add browser.cloud_provider: browser-use to config)"
    fi
else
    warn "CLI not installed — run: curl -fsSL https://browser-use.com/cli/install.sh | bash"
    ok "hermes-agent built-in browser tools still work with local Chromium"
fi

# ── 6. Disk ────────────────────────────────────────────────────────
echo "disk:"
FREE_GB=$(df -h / | tail -1 | awk '{print $4}')
ok "${FREE_GB}B free on / (WSL2)"

echo ""
echo "Run: scripts/start.sh  to start services"
echo "Run: scripts/stop.sh   to stop services"