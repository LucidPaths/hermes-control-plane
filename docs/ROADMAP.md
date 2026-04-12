# Roadmap — Hermes Control Plane

## Vision

A self-hosted, self-improving, always-on AI system that boots with your computer. Five existing open-source projects wired together through thin integration layers. The system compounds: it learns your world, optimizes its own skills, and automates your browser — all visible through a single web interface.

The north star: **tell hermes "do X" at night, wake to results.** The control plane is what makes that reliable and observable.

## Project Structure

```
hermes-control-plane/
├── README.md                    # Overview + architecture
├── CREDITS.md                   # Per-component attribution (creator, repo, license)
├── HANDOFF.md                   # Session handoff (living document)
├── upstream/                    # Vendored source code (our base to patch)
│   ├── hermes-webui/            # Cloned from nesquena/hermes-webui (patched)
│   ├── self-evolution/         # Cloned from NousResearch/hermes-agent-self-evolution
│   └── gbrain/                  # Cloned from garrytan/gbrain
├── patches/                     # Our modifications (applied on top of upstream/)
├── extensions/                  # Our NEW code (webui panels, etc.)
├── scripts/                     # Orchestration
│   ├── bootstrap.sh
│   ├── start.sh
│   ├── stop.sh
│   ├── status.sh
│   ├── evolve.sh
│   └── auto-start-windows.ps1
├── config/
│   └── .env.example
└── docs/
    ├── PRINCIPLES.md
    ├── ROADMAP.md
    ├── STATUS.md
    ├── ARCHITECTURE.md
    ├── INTEGRATIONS.md
    └── patches/
```

## Phase 0: Foundation (Current)

**Goal:** Get all five components running locally with minimal configuration. `scripts/start.sh` → everything works on localhost.

### 0.1 Repository bootstrap
- [x] Create GitHub repo (`LucidPaths/hermes-control-plane`)
- [x] Push initial structure (README, PRINCIPLES, ROADMAP, STATUS)
- [x] Vendor upstream repos into `upstream/` (hermes-webui, self-evolution, gbrain)
- [x] Apply Ollama provider patch to vendored webui
- [x] Create CREDITS.md with attributions
- [x] Write orchestration scripts (bootstrap, start, stop, status, evolve)
- [x] Write .env.example
- [ ] Write auto-start scripts and test reboot

### 0.2 Direct execution — minimal stack
- [ ] Run `scripts/start.sh` — starts hermes-webui on port 8787
- [ ] Verify webui can reach hermes-agent gateway
- [ ] Verify sessions from CLI appear in webui
- [ ] Verify workspace browsing works
- [ ] Verify memory/skills panels work
- [ ] Verify cron panel works

### 0.3 Direct execution — full stack
- [ ] Run `scripts/bootstrap.sh` — installs gbrain, self-evolution, browser-use
- [ ] gbrain init with PGLite (local, no Supabase)
- [ ] gbrain import wiki content
- [ ] gbrain MCP bridge to hermes-agent
- [ ] self-evolution can read hermes sessions
- [ ] browser-use CLI installed, local Chromium working
- [ ] All services healthy, webui reachable at localhost:8787

### 0.4 Auto-start
- [ ] `auto-start-windows.ps1` — Windows Task Scheduler to run on login
  - Starts WSL
  - Runs `scripts/start.sh` in control-plane directory
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
- [ ] Verify hermes-agent's built-in browser tools work in WSL
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
- [ ] Process healthchecks for all services
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
              ├── hermes-gateway (via hermes-agent venv)
              ├── hermes-webui  (python3 bootstrap.py, port 8787)
              ├── gbrain         (PGLite, on-demand CLI & MCP)
              └── self-evolution (on-demand, not always-on)

Browser auto-opens http://localhost:8787
```

Note: Docker is deferred to Phase 5 (hardening). Current deployment runs all
services directly in WSL via the orchestration scripts. Docker Compose configs
remain part of the roadmap for when containerization is needed.

## What New Sessions Should Check

1. Read this `ROADMAP.md` for the vision and phase structure
2. Read `docs/STATUS.md` for what's currently built and wired
3. Read `docs/PRINCIPLES.md` for decision-making guardrails
4. Run `scripts/status.sh` for health overview
5. Check `docs/INTEGRATIONS.md` for per-component wiring notes
6. Pick up from the first unchecked item in the current phase