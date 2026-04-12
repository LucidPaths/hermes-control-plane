# Status — Hermes Control Plane

Last updated: 2026-04-12 (Phase 0 complete)

## What's Built and Verified

| Component | Status | Details |
|-----------|--------|---------|
| hermes-agent | ✅ Running | WSL, gateway active inside session |
| hermes-webui | ✅ Running | http://localhost:8787, health OK, uptime verified |
| gbrain | ✅ Installed | v0.9.0, PGLite, 9 pages from ~/wiki/, keyword search working |
| self-evolution | ✅ Installed | cloned, deps in hermes-agent venv, session DB access verified |
| browser-use | ✅ Installed | CLI at ~/.browser-use-env, hermes local browser working |

## Verified Capabilities

- ✅ webui health endpoint responds (`/health`)
- ✅ gbrain search returns relevant results (tested "how does governance harness work")
- ✅ gbrain doctor reports healthy
- ✅ self-evolution finds hermes-agent path and skills
- ✅ hermes-agent has 945 session files readable by self-evolution
- ✅ browser-use doctor passes 3/5 (cloud key + optional tools missing)
- ✅ hermes built-in browser tools work (used browser_navigate this session)

## Directory Layout

```
~/hermes-control-plane/       → this repo (everything in one place)
├── upstream/hermes-webui/    → web UI source (with Ollama patch applied)
├── upstream/self-evolution/  → DSPy + GEPA optimizer source
├── upstream/gbrain/          → brain source (PGLite + MCP)
├── patches/                  → our modifications to upstream
├── extensions/               → our new code (Phase 1+)
├── scripts/                  → orchestration
├── config/                   → .env.example
└── docs/                     → principles, roadmap, architecture
~/.hermes/hermes-agent/       → hermes-agent source + venv (runtime, not vendored)
~/.hermes/                    → hermes state (sessions, skills, memory, config)
~/.gbrain/                    → gbrain PGLite database
~/.browser-use-env/           → browser-use Python venv (runtime, not vendored)
~/.local/bin/bun              → bun runtime
~/.bun/bin/gbrain             → gbrain CLI (compiled from upstream/gbrain/)
```

## Patches Applied (to vendored upstream/ code)

| Patch | File | Root Cause | Fix |
|-------|------|-----------|-----|
| [webui-ollama-provider.patch](../patches/webui-ollama-provider.patch) | `upstream/hermes-webui/api/onboarding.py` + `api/config.py` | WebUI only recognized 4 providers (openrouter/anthropic/openai/custom), checked OPENAI_API_KEY for custom endpoints. Ollama uses OLLAMA_API_KEY — went undetected. | Added ollama to `_SUPPORTED_PROVIDER_SETUPS`, remap `custom→ollama` when base_url contains ollama, check `OLLAMA_API_KEY` in readiness |

Patch already applied in vendored source. Documentation: [docs/patches/webui-ollama-provider.md](patches/webui-ollama-provider.md)

## Known Gaps

| Gap | Impact | Fix |
|-----|--------|-----|
| gbrain has 0 embeddings | Vector search unavailable (keyword works) | Set OPENAI_API_KEY, run `gbrain embed --stale` |
| browser-use cloud not configured | No residential proxies/anti-detect | Set BROWSER_USE_API_KEY, add `cloud_provider: browser-use` to config |
| webui shows 0 CLI sessions | CLI bridge needs sessions.db populated | Sessions created in webui work; historical CLI sessions need import |
| model group shows "Custom" not "Ollama Cloud" | Cosmetic — model dropdown works, label just says Custom | Future: remap in get_available_models() provider display |
| gateway not running as persistent process | Stops when hermes CLI session ends | Run via `start.sh` or configure as systemd service |
| Auto-start not configured | Manual start required after reboot | Run `auto-start-windows.ps1` setup instructions |

## Current Phase

**Phase 0 COMPLETE.** Moving to Phase 1 (Brain Integration).

### Next Steps (Phase 1)
- [ ] Write gbrain skill for hermes-agent (brain-first lookup, entity detection)
- [ ] Set up gbrain cron recipes (daily sync, embed, doctor)
- [ ] Design and build brain panel in hermes-webui
- [ ] Migrate wiki/ content into gbrain schema (people/, companies/, concepts/)

### Environment
- Platform: WSL2 Ubuntu on Windows 11
- Python: 3.12 (system) + 3.11 (hermes venv)
- Node: v22.22.1, Bun: v1.3.12
- Disk (Windows C:): ~22 GB free
- RAM: 32 GB, VRAM: 16 GB