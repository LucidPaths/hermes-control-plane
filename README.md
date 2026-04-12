# Hermes Control Plane

The convergence layer. Hermes Agent + gbrain + self-evolution + browser-use + hermes-webui, wired into a self-hosted, self-improving, always-on system that boots with your computer.

## What This Is

Not a new app. A wiring project. Five existing open-source systems, each excellent alone, combined into something greater:

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
  └── Task Scheduler → WSL → docker compose up
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

## Quick Start

```bash
cd ~/hermes-control-plane
./scripts/bootstrap.sh
```

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full build plan.

## Principles

See [docs/PRINCIPLES.md](docs/PRINCIPLES.md) — derived from HiveMind's Principle Lattice, adapted for this project.

## Status

See [docs/STATUS.md](docs/STATUS.md) — what's built, what's wired, what's missing.