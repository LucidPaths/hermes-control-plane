# Architecture — Hermes Control Plane

## Component Wiring Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                                │
│                    http://localhost:8787                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     hermes-webui                                 │ │
│  │  ┌─────────┬──────────┬────────────┬───────┬─────────┬────────┐ │ │
│  │  │Sessions │   Chat   │  Workspace │ Brain │Evo Stats │Memory  │ │ │
│  │  │ + Cron  │  + Tools │  + Files   │       │         │+Skills │ │ │
│  │  └─────────┴──────────┴────────────┴───────┴─────────┴────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│          │ SSE/streaming          │ file ops           │ MCP/CLI     │
│          ▼                        ▼                    ▼             │
│  ┌─────────────────┐    ┌─────────────────┐   ┌───────────────┐    │
│  │  hermes-agent    │    │  workspace/     │   │    gbrain     │    │
│  │  (gateway)       │    │  (mounted vol)  │   │  (PGLite +    │    │
│  │                  │    │                 │   │   MCP server)  │    │
│  │  - agent loop    │◄──►│  - project code │   │               │    │
│  │  - skills        │    │  - brain repo   │   │  - search     │    │
│  │  - memory        │    │  - webui state  │   │  - entities   │    │
│  │  - cron          │    └─────────────────┘   │  - embeddings │    │
│  │  - MCP client    │                          └───────┬───────┘    │
│  │  - browser tools │                                  │            │
│  └────────┬─────────┘                          gbrain CLI         │
│           │                                                       │
│           │ spawns on-demand                                      │
│           ▼                                                       │
│  ┌─────────────────────┐    ┌─────────────────────┐              │
│  │  self-evolution      │    │  browser-use         │              │
│  │  (DSPy + GEPA)       │    │  (cloud browser)     │              │
│  │                      │    │                      │              │
│  │  - reads sessions    │    │  - local Chromium    │              │
│  │  - evolves skills   │    │  - cloud proxies     │              │
│  │  - produces PRs     │    │  - anti-detect       │              │
│  └─────────────────────┘    └─────────────────────┘              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

Persistent Data:
  ~/.hermes/          → hermes config, sessions, skills, memory
  ~/.gbrain/           → gbrain PGLite database, brain repo
  ~/hermes-control-plane/config/  → compose, env, overlays
  ~/hermes-webui-state/            → webui sessions, settings, projects

Auto-Start:
  Windows Task Scheduler → PowerShell → WSL → scripts/start.sh (direct execution, no Docker)
```

## Data Flow

### Chat Flow (every turn)
```
User types message
  → hermes-webui (SSE)
    → hermes-agent gateway
      → Load: SOUL.md + rules + memory + working_state + skills + context
      → Check: gbrain search (if skill installed)
      → LLM inference (provider-agnostic)
      → Tool calls (browser, file, terminal, etc.)
        → browser-use (if cloud-enabled)
      → Response
    ← hermes-webui renders response
  ← User sees response

After response:
  → hermes-agent writes to session DB
  → gbrain entity detection (if skill installed)
  → gbrain import new knowledge (if skill installed)
  → gbrain embed --stale (if cron trigger or batch)
```

### Self-Evolution Flow (on-demand/scheduled)
```
Trigger (cron or manual)
  → self-evolution reads hermes session DB
  → selects skill/prompt/tool to evolve
  → generates eval dataset (synthetic or session-based)
  → GEPA optimizer runs variants
  → constraint gates (tests, size, semantic preservation)
  → best variant produces PR
  → human reviews in webui evolution panel
  → approved variants written to hermes skills directory
```

### Brain Growth Flow (continuous)
```
Signal arrives (conversation, email, meeting)
  → hermes-agent detects entities
  → gbrain get <entity> (check if page exists)
  → if exists: gbrain import (update)
  → if not: gbrain import (create new page)
  → gbrain embed --stale (batch embeddings)

Daily cron:
  → gbrain sync --repo ~/brain/
  → gbrain embed --all (comprehensive reindex)
  → gbrain doctor (health check)
```

## Integration Surfaces

### hermes-agent ↔ hermes-webui
- **Protocol:** HTTP SSE (webui is a thin client)
- **Data:** webui imports hermes-agent Python modules directly (not REST)
- **State:** shared `~/.hermes/` directory (sessions, skills, memory, config)
- **Key file:** `~/.hermes/sessions/sessions.db` (SQLite, shared read)

### hermes-agent ↔ gbrain
- **Protocol:** MCP (gbrain exposes 30 MCP tools via stdio)
- **Alternative:** hermes skill that shells out to `gbrain` CLI
- **Config:** gbrain MCP server defined in hermes `config.yaml` under mcpServers
- **Data flow:** hermes calls gbrain search/get/import before/after responses

### hermes-agent ↔ browser-use
- **Protocol:** hermes built-in browser tools (browser_navigate, browser_click, etc.)
- **Routing:** `config.yaml` → `browser.cloud_provider: browser-use` → cloud browsers
- **Alternative:** browser-use CLI, driven via hermes terminal tool
- **Config:** `BROWSER_USE_API_KEY` in `.env`

### hermes-agent ↔ self-evolution
- **Protocol:** self-evolution reads hermes sessions directly from SQLite
- **Trigger:** manual (`evolve.sh`) or cron (`hermes cron`)
- **Output:** evolved skill files written to `~/.hermes/skills/`
- **Data flow:** sessions → eval dataset → GEPA → skill variants → constraint gates → approved skills

### hermes-webui ↔ gbrain
- **Protocol:** gbrain CLI commands via subprocess, or gbrain MCP tools via hermes-agent
- **Data:** brain panel in webui calls gbrain CLI, displays results
- **Alternative:** gbrain MCP server exposed directly to webui (Phase 4+)

### hermes-webui ↔ self-evolution
- **Protocol:** evolution run data (reports, diffs) read from filesystem
- **Data:** evolution panel displays run history, triggers new runs
- **Alternative:** REST API if self-evolution adds one (currently CLI-only)