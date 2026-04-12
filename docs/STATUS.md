# Status — Hermes Control Plane

Last updated: 2026-04-12

## What's Built

| Component | Local Status | Docker | Wired |
|-----------|-------------|--------|-------|
| hermes-agent | ✅ Running (WSL) | ❌ Not containerized | N/A |
| hermes-webui | ❌ Not installed | ❌ | ❌ |
| gbrain | ❌ Not installed | ❌ | ❌ |
| self-evolution | ❌ Not installed | ❌ | ❌ |
| browser-use | ❌ Not configured | N/A (cloud) | ❌ |

## What's Wired

Nothing yet. This is Phase 0 start.

## Current Phase

**Phase 0.1** — Repository bootstrap

### Next Steps
- [ ] Push this repo to GitHub (LucidPaths/hermes-control-plane)
- [ ] Clone hermes-webui into workspace
- [ ] Clone gbrain into workspace
- [ ] Clone hermes-agent-self-evolution into workspace
- [ ] Write bootstrap.sh
- [ ] Write docker-compose.minimal.yml (hermes + webui)
- [ ] Test minimal stack
- [ ] Write docker-compose.yml (full stack)
- [ ] Test full stack
- [ ] Write auto-start scripts

### Known Blockers
- hermes-agent currently runs directly in WSL, not Docker. Need to decide: containerize hermes-agent, or run webui+gbrain in Docker while hermes-agent stays on host.
- gbrain requires `bun` runtime. Need to verify bun availability in Docker or on host.
- self-evolution requires hermes session DB path. Need to verify path mapping.

### Environment
- Platform: WSL2 Ubuntu on Windows 11
- hermes-agent: running at ~/.hermes/hermes-agent
- hermes config: ~/.hermes/config.yaml
- hermes sessions: ~/.hermes/sessions/ (SQLite)
- Python venv: ~/.hermes/hermes-agent/venv/