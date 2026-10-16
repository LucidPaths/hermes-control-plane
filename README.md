> **SUPERSEDED (16 Oct 2026). This repository is archived and no longer maintained.**
> It describes the original Windows/WSL wiring plan (last real commit 12 Apr 2026). Hermes now runs on the EVO-X2 (Strix).
> Current sources of truth: [LucidPaths/evo-x2-infrastructure](https://github.com/LucidPaths/evo-x2-infrastructure) for the host and runtime, and [LucidPaths/fleet](https://github.com/LucidPaths/fleet) for agent standards and the Grok Bot + Hermes architecture.
> Do not reference or deploy from this repo.

# Hermes Control Plane

The convergence layer. Hermes Agent + gbrain + self-evolution + browser-use + hermes-webui, wired into a self-hosted, self-improving, always-on system that boots with your computer.

## What This Is

Not a new app. A wiring project. Five existing open-source systems, each excellent alone, combined into something greater. All upstream source vendored in this repo under `upstream/`. See [CREDITS.md](CREDITS.md) for attributions.

| Component | Repo | Role |
|-----------|------|------|
| **hermes-agent** | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Core engine — agent loop, tools, memory, cron, skills |
| **hermes-webui** | [nesquena/hermes-webui](https://github.com/nesquena/hermes-webui) | Surface — three-panel web UI, sessions, workspace, cron, skills editor |
| **gbrain** | [garrytan/gbrain](https://github.com/garrytan/gbrain) | Brain — world knowledge, compounding memory, PGLite + pgvector search |
| **self-evolution** | [NousResearch/hermes-agent-self-evolution](https://github.com/NousResearch/hermes-agent-self-evolution) | Optimizer — DSPy + GEPA auto-evolution of skills, prompts, tools |
| **browser-use** | [browser-use/browser-use](https://github.com/browser-use/browser-use) | Browser — cloud browser automation, residential proxies, anti-detect |

## Architecture

```
Windows Boot
  └── Task Scheduler → WSL → scripts/start.sh
        │
        ├── hermes-agent (gateway, cron, skills, memory)
        ├── hermes-webui  (port 8787, the surface)
        ├── gbrain         (PGLite, brain search, MCP server)
        └── browser-use    (cloud browser backend for hermes tools)

        ┌─────────────────────────────────────────────────┐
        │              hermes-webui (browser)              │
        │  ┌──────────┬──────────┬──────────────────────┐ │
        │  │ Sessions │   Chat   │ Workspace / Brain     │ │
        │  │  + Cron  │  + Tools │  + Evolution + Stats  │ │
        │  └──────────┴──────────┴──────────────────────┘ │
        └─────────────────────────────────────────────────┘
          │ SSE/streaming          │ MCP tools          │ gbrain CLI
          ▼                        ▼                    ▼
        hermes-agent ←────────── browser-use         gbrain
          │                        │                    │
          │ self-evolution         │                    ▼
          └──► DSPy + GEPA ──► evolved skills/prompts   Search index
                (on-demand)                           (markdown truth)
```

## Repo Structure

```
hermes-control-plane/
├── README.md                    # This file
├── CREDITS.md                   # Per-component attribution + licenses
├── HANDOFF.md                   # Session handoff (living document)
├── upstream/                    # Vendored source code
│   ├── hermes-webui/            # Web UI (with our patches applied)
│   ├── self-evolution/         # DSPy + GEPA optimizer
│   └── gbrain/                 # PGLite brain + MCP server
├── patches/                     # Our modifications to upstream/
├── extensions/                  # Our new code (webui panels, etc.)
├── scripts/                     # Orchestration (bootstrap, start, stop, status)
├── config/                      # .env.example
└── docs/                        # Principles, roadmap, architecture, integrations
```

## Quick Start

```bash
cd ~/hermes-control-plane
./scripts/start.sh
# Open http://localhost:8787
```

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full build plan.

## Principles

See [docs/PRINCIPLES.md](docs/PRINCIPLES.md) — 10 principles derived from HiveMind's Principle Lattice.

## Status

See [docs/STATUS.md](docs/STATUS.md) — what's built, what's wired, what's missing.