# Roadmap — Hermes Control Plane

## Vision

A self-hosted, self-improving, always-on AI system that boots with your computer. Five existing open-source projects wired together through thin integration layers. The system compounds: it learns your world, optimizes its own skills, and automates your browser — all visible through a single web interface.

The north star: **tell hermes "do X" at night, wake to results.** The control plane is what makes that reliable and observable.

## Project Structure

```
hermes-control-plane/
├── README.md                    # This file + overview
├── docs/
│   ├── PRINCIPLES.md            # 10 principles, derived from HiveMind
│   ├── ROADMAP.md               # You are here
│   ├── STATUS.md                # What's built, what's wired, what's missing
│   ├── ARCHITECTURE.md          # Detailed component wiring diagram
│   └── INTEGRATIONS.md          # Per-component integration notes
├── config/
│   ├── docker-compose.yml        # Production compose (all 5 services)
│   ├── docker-compose.minimal.yml # Minimal compose (hermes + webui only)
│   ├── .env.example              # Template with all config keys
│   ├── hermes/                   # hermes-agent config overlays
│   │   └── config.overlay.yaml
│   └── gbrain/                   # gbrain config overlays
│       └── schema.overlay.yaml
├── integrations/
│   ├── gbrain/                   # gbrain wiring (skill pack, cron, MCP)
│   │   ├── skillpack.md          # Custom skill teaching hermes to use gbrain
│   │   ├── cron-recipes.yaml     # Scheduled sync/embed jobs
│   │   └── mcp-bridge.md         # How gbrain MCP connects to hermes
│   ├── evolution/                # self-evolution wiring
│   │   ├── triggers.md           # When to run evolution (cron, session count, error patterns)
│   │   └── skill-importer.md     # How self-evolution reads hermes sessions
│   └── browser-use/              # browser-use wiring
│       ├── config.md             # Cloud provider vs local config
│       └── skill.md              # Teaching hermes to use browser-use directly
├── scripts/
│   ├── bootstrap.sh              # One-command setup: clone repos, configure, start
│   ├── start.sh                  # Start all services
│   ├── stop.sh                   # Graceful stop
│   ├── status.sh                 # Check health of all services
│   ├── auto-start-windows.ps1    # Windows Task Scheduler auto-start
│   ├── auto-start-wsl.sh         # WSL systemd auto-start
│   └── evolve.sh                 # Trigger a self-evolution run
└── extensions/
    └── webui-panels/             # Custom panels for hermes-webui
        ├── brain-panel/           # gbrain search/entity panel
        ├── evolution-panel/       # self-evolution status/run panel
        └── stats-panel/           # Aggregate stats dashboard
```

## Phase 0: Foundation (Current)

**Goal:** Get all five components running locally with minimal configuration. Docker Compose up → everything works on localhost.

### 0.1 Repository bootstrap
- [ ] Create GitHub repo (`LucidPaths/hermes-control-plane`)
- [ ] Push initial structure (README, PRINCIPLES, ROADMAP, STATUS)
- [ ] Clone all dependency repos into workspace
- [ ] Write `scripts/bootstrap.sh` that:
  - Clones hermes-agent, hermes-webui, gbrain, self-evolution
  - Checks/installs Docker, Docker Compose
  - Creates `.env` from `.env.example`
  - Runs `gbrain init` (PGLite, no keys needed)
  - Runs hermes-agent health check
  - Prints next steps

### 0.2 Docker Compose — minimal stack
- [ ] `docker-compose.minimal.yml` — hermes-agent + hermes-webui + volume mounts
- [ ] Verify webui can reach hermes-agent gateway
- [ ] Verify sessions from CLI appear in webui
- [ ] Verify workspace browsing works
- [ ] Verify memory/skills panels work
- [ ] Verify cron panel works

### 0.3 Docker Compose — full stack
- [ ] `docker-compose.yml` — add gbrain service + self-evolution service
- [ ] gbrain init with PGLite (local, no Supabase)
- [ ] gbrain MCP bridge to hermes-agent
- [ ] browser-use config (local Chromium first, cloud later)
- [ ] self-evolution can read hermes sessions
- [ ] All services healthy, webui reachable at localhost:8787

### 0.4 Auto-start
- [ ] `auto-start-windows.ps1` — Windows Task Scheduler to run on login
  - Starts WSL
  - Runs `docker compose up -d` in control-plane directory
  - Opens browser to localhost:8787
- [ ] `auto-start-wsl.sh` — systemd alternative for always-on servers
- [ ] Test: reboot machine → all services running, webui accessible

## Phase 1: Brain Integration

**Goal:** hermes-agent reads gbrain before responding and writes to gbrain after conversations. The compounding loop is alive.

### 1.1 gbrain skill pack for hermes
- [ ] Write skill that teaches hermes to:
  - Run `gbrain search` before answering factual questions
  - Run `gbrain query` for complex multi-entity queries
  - Run `gbrain get` for specific entity lookups
  - Run `gbrain import` after learning new information
  - Detect entities (people, companies, concepts) in conversations
  - Trigger `gbrain embed --stale` after imports
- [ ] Install skill: `hermes skills install` from local file
- [ ] Test: ask hermes about a person, verify it checks brain first

### 1.2 gbrain cron recipes
- [ ] Daily sync: `gbrain sync --repo ~/brain/ && gbrain embed --stale`
- [ ] Daily enrichment: scan for entities with incomplete pages
- [ ] Weekly reindex: `gbrain embed --all` (slow but thorough)
- [ ] Configure via hermes cron panel in webui

### 1.3 Brain panel in webui
- [ ] Design panel: search bar, recent queries, entity cards
- [ ] Wire panel to gbrain MCP/CLI commands
- [ ] Test: search in panel, verify results match CLI

## Phase 2: Self-Evolution Integration

**Goal:** hermes-agent's skills, prompts, and tool descriptions automatically evolve based on real session data. The optimizer runs on schedule and produces PRs for human review.

### 2.1 Session bridge
- [ ] Verify hermes-agent-self-evolution can read hermes session DB
- [ ] Run synthetic eval: `python -m evolution.skills.evolve_skill --skill github-code-review --iterations 3 --eval-source sessiondb`
- [ ] Confirm evolved skill passes all guardrails

### 2.2 Evolution triggers
- [ ] Cron job: evolve top 3 most-used skills weekly
- [ ] Cron job: evolve tool descriptions monthly
- [ ] Error-triggered: evolve skill after 3+ failures with the same skill
- [ ] All triggers configurable via webui cron panel

### 2.3 Evolution panel in webui
- [ ] Status: last run, skills evolved, scores before/after
- [ ] Trigger: manual evolution run button
- [ ] History: list of evolved variants with diffs
- [ ] Approval: review and apply evolved skills (or reject)

## Phase 3: Browser-Use Integration

**Goal:** hermes-agent's browser tools route through browser-use cloud when configured, local Chromium otherwise. Zero-config default works, cloud upgrade is a config change.

### 3.1 Local browser (default)
- [ ] Verify hermes-agent's built-in browser tools work in Docker
- [ ] Install browser-use CLI: `curl -fsSL https://browser-use.com/cli/install.sh | bash`
- [ ] Install browser-use skill: `hermes skills install skills-sh/browser-use/browser-use/browser-use`
- [ ] Test: hermes can browse websites via CLI

### 3.2 Cloud browser (upgrade)
- [ ] Get browser-use API key from cloud.browser-use.com
- [ ] Configure `BROWSER_USE_API_KEY` in `.env`
- [ ] Configure `cloud_provider: browser-use` in hermes config overlay
- [ ] Test: hermes browses via cloud with residential proxies
- [ ] Test: agent self-registration works (`hermes setup tools` → Browser Use)

## Phase 4: Stats Dashboard

**Goal:** Observable at a glance. Token usage over time, cost tracking, model switching, tool frequency, brain growth, evolution history.

### 4.1 Data collection
- [ ] hermes-agent session DB → token counts per session
- [ ] gbrain stats → page count, entity count, last sync
- [ ] self-evolution reports → skills evolved, score deltas
- [ ] Aggregate: daily/weekly/monthly rollups

### 4.2 Stats panel in webui
- [ ] Token usage graph (by session, by day, by model)
- [ ] Cost estimation (per model pricing)
- [ ] Tool call frequency heatmap
- [ ] Brain growth timeline (pages, entities, embeddings)
- [ ] Evolution history (skills, scores, PRs)

## Phase 5: Hardening and Polish

**Goal:** Production-grade. Reliable auto-start, backup, monitoring, security.

### 5.1 Reliability
- [ ] Docker healthchecks for all services
- [ ] Automatic restart on failure (`restart: unless-stopped`)
- [ ] Watchdog script that alerts if services are down
- [ ] Backup: gbrain PGLite, hermes sessions, webui state

### 5.2 Security
- [ ] webui password auth enabled by default for non-localhost
- [ ] SSH tunnel or Tailscale for remote access
- [ ] Secrets in `.env`, never in compose YAML
- [ ] gbrain integration credentials validated before writing

### 5.3 Documentation
- [ ] User guide: getting started, configuration, troubleshooting
- [ ] Developer guide: adding panels, extending integrations
- [ ] Video walkthrough: from zero to running system

## Dependency Map

```
Phase 0 (Foundation) ── no dependencies, start here
  │
  ├── Phase 1 (Brain) ── depends on 0.3 (gbrain service running)
  │
  ├── Phase 2 (Evolution) ── depends on 0.3 (evolution service running)
  │
  ├── Phase 3 (Browser) ── depends on 0.3 (hermes agent running)
  │
  └── Phase 4 (Stats) ── depends on 1.1 + 2.1 (data flowing)

Phase 5 (Hardening) ── depends on 0-4 complete
```

Phases 1, 2, and 3 can run in parallel after Phase 0 is complete.

## Reference Repos

| Component | Repo | Key Files |
|-----------|------|-----------|
| hermes-agent | https://github.com/NousResearch/hermes-agent | `config.yaml`, `skills/`, `memory/` |
| hermes-webui | https://github.com/nesquena/hermes-webui | `server.py`, `static/`, `api/routes.py` |
| gbrain | https://github.com/garrytan/gbrain | `src/`, `skills/`, `recipes/`, `docs/GBRAIN_SKILLPACK.md` |
| self-evolution | https://github.com/NousResearch/hermes-agent-self-evolution | `evolution/`, `datasets/`, `tests/` |
| browser-use | https://github.com/browser-use/browser-use | `browser_use/`, `docs/` |
| HiveMind | https://github.com/LucidPaths/HiveMind (local) | `CLAUDE.md`, `docs/PRINCIPLE_LATTICE.md` |

## Auto-Start Architecture

```
Windows Login
  └── Task Scheduler runs auto-start-windows.ps1
        └── wsl -d Ubuntu -- bash ~/hermes-control-plane/scripts/start.sh
              └── docker compose -f docker-compose.yml up -d
                    ├── hermes-agent (port 8080 gateway)
                    ├── hermes-webui  (port 8787)
                    ├── gbrain         (PGLite + MCP on stdio)
                    └── evolution      (on-demand, not always-on)

Browser auto-opens http://localhost:8787
```

## What New Sessions Should Check

1. Read this `ROADMAP.md` for the vision and phase structure
2. Read `docs/STATUS.md` for what's currently built and wired
3. Read `docs/PRINCIPLES.md` for decision-making guardrails
4. Check `docker compose ps` to see what's running
5. Check `docs/INTEGRATIONS.md` for per-component wiring notes
6. Look at `scripts/status.sh` output for health overview
7. Pick up from the first unchecked item in the current phase