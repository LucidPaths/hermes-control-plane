#!/usr/bin/env bash
set -euo pipefail

# Hermes Control Plane — Bootstrap
# One-command setup: install deps, clone repos, configure, verify
# Run once on a fresh machine. Idempotent — safe to re-run.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_DIR="${HERMES_AGENT_DIR:-$HOME/.hermes/hermes-agent}"
BUN_DIR="$HOME/.local/bin"
GBRAIN_BIN="$HOME/.bun/bin/gbrain"
BROWSER_USE_ENV="$HOME/.browser-use-env"

# Colors
G='\033[0;32m'; R='\033[0;31m'; Y='\033[0;33m'; B='\033[0;34m'; X='\033[0m'

ok()   { echo -e "${G}✓${X} $1"; }
fail() { echo -e "${R}✗${X} $1"; exit 1; }
warn() { echo -e "${Y}○${X} $1"; }
step() { echo -e "\n${B}──${X} $1"; }

# ── Step 1: Core tools ──────────────────────────────────────────────
step "Checking core tools"

command -v python3 &>/dev/null || fail "python3 not found"
ok "python3 $(python3 --version 2>&1 | cut -d' ' -f2)"

command -v node &>/dev/null || fail "node not found"
ok "node $(node --version)"

command -v git &>/dev/null || fail "git not found"
ok "git $(git --version 2>&1 | cut -d' ' -f3)"

command -v uv &>/dev/null || warn "uv not found (install: curl -LsSf https://astral.sh/uv/install.sh | sh)"
ok "uv $(uv --version 2>&1 | head -1)"

# ── Step 2: Bun ────────────────────────────────────────────────────
step "Installing bun (gbrain runtime)"

if command -v bun &>/dev/null; then
    ok "bun $(bun --version) already installed"
elif [ -f "$BUN_DIR/bun" ]; then
    ok "bun $($BUN_DIR/bun --version) at $BUN_DIR"
else
    echo "Installing bun via python (avoids unzip dependency)..."
    python3 -c "
import urllib.request, zipfile, os, stat
url = 'https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip'
zip_path = '/tmp/bun.zip'
extract_dir = os.path.expanduser('~/.local/bin')
os.makedirs(extract_dir, exist_ok=True)
urllib.request.urlretrieve(url, zip_path)
with zipfile.ZipFile(zip_path, 'r') as z:
    for member in z.namelist():
        if member.endswith('bun'):
            source = z.read(member)
            target = os.path.join(extract_dir, 'bun')
            with open(target, 'wb') as f: f.write(source)
            os.chmod(target, stat.S_IRWXU)
            break
os.remove(zip_path)
print(f'Installed bun to {extract_dir}/bun')
" || fail "bun install failed"
    ok "bun installed to $BUN_DIR"
fi

export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"

# ── Step 3: gbrain ────────────────────────────────────────────────
step "Installing gbrain"

if command -v gbrain &>/dev/null; then
    ok "gbrain $(gbrain --version 2>&1) already installed"
else
    bun add -g github:garrytan/gbrain 2>&1 | tail -3
    export PATH="$HOME/.bun/bin:$PATH"
    command -v gbrain &>/dev/null || fail "gbrain install failed"
    ok "gbrain $(gbrain --version 2>&1)"
fi

# ── Step 4: Initialize brain ───────────────────────────────────────
step "Initializing gbrain brain"

mkdir -p "$HOME/.gbrain"
if [ -f "$HOME/.gbrain/brain.pglite" ]; then
    ok "brain already exists at ~/.gbrain/brain.pglite"
else
    gbrain init || fail "gbrain init failed"
    ok "brain initialized (PGLite)"
fi

# Import wiki content if it exists and brain is empty
PAGES=$(gbrain stats 2>&1 | grep "Pages:" | awk '{print $2}')
if [ "$PAGES" = "0" ] && [ -d "$HOME/wiki" ]; then
    gbrain import "$HOME/wiki/" --no-embed || warn "wiki import had issues"
    ok "imported wiki content"
else
    ok "brain has $PAGES pages"
fi

# ── Step 5: hermes-webui ───────────────────────────────────────────
step "Cloning hermes-webui"

if [ -d "$HOME/hermes-webui" ]; then
    ok "hermes-webui already cloned at ~/hermes-webui"
else
    git clone https://github.com/nesquena/hermes-webui.git "$HOME/hermes-webui" || fail "clone failed"
    ok "cloned hermes-webui"
fi

# ── Step 6: self-evolution ─────────────────────────────────────────
step "Cloning hermes-agent-self-evolution"

if [ -d "$HOME/hermes-agent-self-evolution" ]; then
    ok "self-evolution already cloned"
else
    git clone https://github.com/NousResearch/hermes-agent-self-evolution.git "$HOME/hermes-agent-self-evolution" || fail "clone failed"
    ok "cloned self-evolution"
fi

# Install into hermes-agent venv
if [ -d "$AGENT_DIR/venv" ] && [ -f "$AGENT_DIR/venv/bin/python" ]; then
    uv pip install -e "$HOME/hermes-agent-self-evolution[dev]" --python "$AGENT_DIR/venv/bin/python" 2>&1 | tail -3
    ok "self-evolution installed into hermes-agent venv"
else
    warn "hermes-agent venv not found at $AGENT_DIR/venv — install self-evolution manually"
fi

# ── Step 7: browser-use ───────────────────────────────────────────
step "Installing browser-use CLI"

if [ -d "$BROWSER_USE_ENV" ]; then
    ok "browser-use already installed at $BROWSER_USE_ENV"
else
    curl -fsSL https://browser-use.com/cli/install.sh | bash 2>&1 | tail -5
    if [ -d "$BROWSER_USE_ENV" ]; then
        ok "browser-use installed"
    else
        warn "browser-use install incomplete (may need sudo for Chromium deps)"
    fi
fi

# ── Step 8: Environment config ─────────────────────────────────────
step "Creating .env from template"

if [ -f "$REPO_ROOT/config/.env" ]; then
    ok ".env already exists"
else
    cp "$REPO_ROOT/config/.env.example" "$REPO_ROOT/config/.env" 2>/dev/null || \
        warn "no .env.example yet — create config/.env manually"
    ok "created config/.env from template"
fi

# ── Done ───────────────────────────────────────────────────────────
step "Bootstrap complete"
echo ""
echo "  Services status:"
echo "    hermes-agent   → check: pgrep -f 'run_agent.py|gateway'"
echo "    hermes-webui   → check: curl -s http://127.0.0.1:8787/health"
echo "    gbrain          → check: gbrain doctor"
echo "    self-evolution  → check: cd ~/hermes-agent-self-evolution && python -m evolution.skills.evolve_skill --help"
echo "    browser-use     → check: source $BROWSER_USE_ENV/bin/activate && browser-use doctor"
echo ""
echo "  Start everything:  ~/hermes-control-plane/scripts/start.sh"
echo "  Check status:      ~/hermes-control-plane/scripts/status.sh"