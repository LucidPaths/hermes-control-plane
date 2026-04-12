# Integration Notes — Per-Component Wiring Details

## 1. hermes-webui

**Repo:** https://github.com/nesquena/hermes-webui
**Key files:** `server.py`, `static/ui.js`, `static/panels.js`, `api/routes.py`
**Language:** Python backend, vanilla JS frontend
**Port:** 8787
**State dir:** `~/.hermes/webui-mvp/`

### Wiring Strategy (P3: Pillage, Don't Build)
hermes-webui already has sessions, chat, workspace, skills editor, memory editor, cron panel, profiles. We DO NOT fork and modify. We:
1. Run it as-is via Docker or `start.sh`
2. Add custom panels via volume-mounted JS/CSS extensions
3. The panel extensions are in `extensions/webui-panels/` in this repo

### How it talks to hermes-agent
- Imports hermes-agent Python modules directly (not REST)
- Shares `~/.hermes/` directory
- Reads sessions from SQLite directly
- Streaming via SSE from hermes-agent gateway

### Extension Points
- **Panels:** webui has a panel system (chat, tasks, skills, memory, profiles, todos, spaces). Custom panels can be added via `static/panels.js` extension
- **Slash commands:** Custom `/brain`, `/evolve` commands pass through to hermes-agent
- **Settings:** Environment variables control behavior

### Blockers
- Need to verify if panel extensions can be volume-mounted without modifying webui source
- If not, need a thin fork that loads extension panels from a directory
- Alternative: inject custom panels via `static/` volume overlay

---

## 2. gbrain

**Repo:** https://github.com/garrytan/gbrain
**Key files:** `src/`, `skills/GBRAIN_SKILLPACK.md`, `docs/GBRAIN_RECOMMENDED_SCHEMA.md`
**Language:** TypeScript (Bun runtime)
**Database:** PGLite (embedded Postgres) or Supabase

### Wiring Strategy (P2: Provider Agnosticism + P3: Simplicity Wins)
gbrain has first-class hermes-agent support. Install via `hermes skills install gbrain` or CLI. The skill pack teaches hermes HOW to use gbrain (brain-first lookup, entity detection, back-linking). This is the integration — we don't build a new one.

### Installation
```bash
# Install gbrain CLI
bun add -g github:garrytan/gbrain

# Initialize local brain (PGLite, no server)
gbrain init

# Import existing wiki/brain content
gbrain import ~/wiki/ --no-embed

# Generate embeddings
gbrain embed --stale

# Install skill for hermes-agent
# (gbrain ships with skillpack that teaches hermes to use it)
```

### MCP Bridge
gbrain exposes 30 MCP tools via stdio. Add to hermes config:
```yaml
mcpServers:
  gbrain:
    command: gbrain
    args: ["serve"]
```

### Key Commands for hermes-agent Skill
```bash
gbrain search "query"          # Hybrid search (keyword + vector + RRF)
gbrain query "natural language" # Multi-query expansion + LLM chunking
gbrain get <entity>             # Get specific entity page
gbrain import <path>            # Import markdown files
gbrain sync --repo <path>       # Sync brain repo changes
gbrain embed --stale            # Embed new/changed pages
gbrain stats                    # Page count, entity count
gbrain doctor                   # Health check
```

### Brain Schema (gbrain's recommended structure)
```
~/brain/
├── people/           # One page per person
├── companies/        # One page per company
├── deals/            # One page per deal/opportunity
├── concepts/         # Ideas, frameworks, mental models
├── projects/         # Active projects
├── media/            # Articles, papers, books
├── meetings/         # Meeting transcripts with entity links
└── README.md         # Resolver (how to categorize new pages)
```

This replaces our `~/wiki/` structure with something more organized and queryable. The wiki content should be migrated into gbrain's schema.

### Migration from wiki/
```bash
# Import existing wiki content
gbrain import ~/wiki/ --no-embed

# Then generate embeddings
gbrain embed --stale
```

### Cron Jobs
- Every hour: `gbrain sync --repo ~/brain/`
- Every 6 hours: `gbrain embed --stale`
- Daily: `gbrain doctor`
- Weekly: `gbrain embed --all` (full reindex)

### Upgrades
- PGLite (default): no server, no API keys, works locally
- Supabase: `gbrain migrate --to supabase` when brain grows (1000+ pages)
- Supabase Pro tier ($25/mo) for remote access and production scale

---

## 3. hermes-agent-self-evolution

**Repo:** https://github.com/NousResearch/hermes-agent-self-evolution
**Key files:** `evolution/skills/evolve_skill.py`, `evolution/`, `datasets/`
**Language:** Python (DSPy + GEPA)
**API cost:** $2-10 per optimization run

### Wiring Strategy (P9: Compounding Intelligence)
self-evolution reads hermes session DB directly. No bridge needed — it already has a session importer. We configure it and trigger it on schedule.

### Installation
```bash
git clone https://github.com/NousResearch/hermes-agent-self-evolution.git
cd hermes-agent-self-evolution
pip install -e ".[dev]"
```

### Configuration
```bash
export HERMES_AGENT_REPO=~/.hermes/hermes-agent

# Evolve a skill using synthetic data
python -m evolution.skills.evolve_skill \
    --skill github-code-review \
    --iterations 10 \
    --eval-source synthetic

# Evolve using real session data
python -m evolution.skills.evolve_skill \
    --skill github-code-review \
    --iterations 10 \
    --eval-source sessiondb
```

### Guardrails (built into self-evolution)
1. Full test suite must pass
2. Skills ≤15KB, tool descriptions ≤500 chars
3. No mid-conversation changes
4. Semantic preservation (must not drift from original purpose)
5. PR review required (never direct commit)

### Cron Triggers
- Weekly: evolve top 3 most-used skills
- Monthly: evolve tool descriptions
- On-demand: `evolve.sh <skill-name>`
- Error-triggered: after 3+ failures with the same skill

### Output
- Evolved skill variants in `reports/` directory
- PRs against hermes-agent skills directory
- Evolution panel in webui displays history, diffs, and approval buttons

---

## 4. browser-use

**Docs:** https://docs.browser-use.com/cloud/tutorials/integrations/hermes-agent
**Repo:** https://github.com/browser-use/browser-use
**Config:** Two paths — cloud browser backend, or CLI

### Path 1: Cloud Browser Backend (recommended)
hermes-agent's built-in browser tools automatically route through browser-use cloud:

```yaml
# ~/.hermes/config.yaml
browser:
  cloud_provider: browser-use
```

```bash
# ~/.hermes/.env
BROWSER_USE_API_KEY=your_key_here
```

No code changes needed. hermes-agent's browser_navigate, browser_click, etc. just work on cloud browsers.

### Path 2: Browser Use CLI (advanced)
```bash
# Install CLI
curl -fsSL https://browser-use.com/cli/install.sh | bash

# Install skill for hermes-agent
hermes skills install skills-sh/browser-use/browser-use/browser-use

# Use via hermes terminal tool
browser-use doctor   # verify installation
browser-use browse "https://example.com"  # direct CLI usage
```

### Benefits over local Chromium
- Residential proxies in 195+ countries
- Anti-detect browser profiles
- Persistent sessions and cookies
- Bypasses CAPTCHAs more reliably

### Cost Consideration
- Local Chromium: free, works for most tasks
- Browser-use cloud: $0.001-0.01 per page depending on plan
- Start local, upgrade to cloud when needed (P2: Provider Agnosticism)