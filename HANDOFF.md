# Session Handoff — 2026-04-12

## What We Built This Session

Hermes Control Plane — a wiring project that combines 5 open-source systems into a self-hosted, self-improving, always-on AI system that boots with your computer.

**Repo:** https://github.com/LucidPaths/hermes-control-plane

### Phase 0 COMPLETE. All 5 services installed, wired, verified:

| Component | Source | Where Installed | Verified |
|-----------|--------|----------------|----------|
| hermes-webui | nesquena/hermes-webui | ~/hermes-webui/ | health OK, localhost:8787 |
| gbrain | garrytan/gbrain | ~/.bun/bin/gbrain, DB at ~/.gbrain/ | 9 pages imported, keyword search works |
| self-evolution | NousResearch/hermes-agent-self-evolution | ~/hermes-agent-self-evolution/ | reads hermes sessions, finds skills |
| browser-use | browser-use/browser-use | ~/.browser-use-env/ | doctor 3/5, local chromium works |
| bun runtime | oven-sh/bun | ~/.local/bin/bun | v1.3.12 |

### Patch Applied (in ~/hermes-webui, commit 1c2c3ac):
WebUI didn't recognize Ollama as a provider — only knew openrouter/anthropic/openai/custom, checked OPENAI_API_KEY for everything. Ollama uses OLLAMA_API_KEY. Fix: 17 lines across api/onboarding.py and api/config.py. Now provider_ready=true, chat_ready=true. Patch file at docs/patches/webui-ollama-provider.patch.

---

## THE TASK FOR NEXT SESSION: Repo Restructuring

### What The User Wants

The control-plane repo should contain the actual source code of every project we depend on — not just docs and scripts. The vision: one repo, one clone, everything there. Vendored (copied in), not submodules. We don't care about upstream updates — we patch our own code. If important upstream changes land, we cherry-pick manually.

Motivation: ability to tweet "we took code from @creator1 @creator2 @creator3 and built THIS" with everything traceable in one repo.

### Target Structure

```
hermes-control-plane/
├── README.md                    # Overview with creator credits + links
├── LICENSE                      # MIT (project overall)
├── CREDITS.md                   # Per-component attribution (creator, repo, license)
│
├── upstream/                    # Vendored source code (our base to patch)
│   ├── hermes-webui/            # Cloned from nesquena/hermes-webui
│   │   └── (full source, with our patch already applied)
│   ├── self-evolution/          # Cloned from NousResearch/hermes-agent-self-evolution
│   │   └── (full source, unmodified)
│   └── gbrain/                  # Cloned from garrytan/gbrain
│       └── (full source, unmodified)
│
├── patches/                     # Our modifications (applied on top of upstream/)
│   └── webui-ollama-provider.patch   # Already exists at docs/patches/, MOVE HERE
│
├── extensions/                  # Our NEW code (doesn't exist in upstream)
│   └── webui-panels/            # Custom panels for webui (Phase 1+)
│
├── scripts/                     # Our orchestration (already built)
│   ├── bootstrap.sh
│   ├── start.sh
│   ├── stop.sh
│   ├── status.sh
│   ├── evolve.sh
│   └── auto-start-windows.ps1
│
├── config/
│   └── .env.example
│
└── docs/                        # Our documentation
    ├── PRINCIPLES.md
    ├── ROADMAP.md
    ├── STATUS.md
    ├── ARCHITECTURE.md
    ├── INTEGRATIONS.md
    └── patches/
        └── webui-ollama-provider.md  # Patch documentation (keep alongside .patch)
```

### Step-by-Step Plan for Next Session

1. **Pre-flight: verify current state.** Run `scripts/status.sh`, check all services. Note what's running vs not.

2. **Read this handoff doc.** Then read `docs/STATUS.md` and `docs/PRINCIPLES.md` for context.

3. **Create `upstream/` directory.** This will hold vendored source.

4. **Move hermes-webui into upstream/.**
   - Current location: ~/hermes-webui/ (has our Ollama patch applied at commit 1c2c3ac)
   - Target: ~/hermes-control-plane/upstream/hermes-webui/
   - Method: `mv ~/hermes-webui ~/hermes-control-plane/upstream/hermes-webui`
   - CRITICAL: the Ollama patch is already applied in this clone. Verify it's there after moving.
   - Update all scripts that reference ~/hermes-webui to use the new path

5. **Clone self-evolution into upstream/.**
   - Current: ~/hermes-agent-self-evolution/
   - Target: ~/hermes-control-plane/upstream/self-evolution/
   - Method: `mv ~/hermes-agent-self-evolution ~/hermes-control-plane/upstream/self-evolution`
   - No modifications to this repo, pure vendor

6. **Clone gbrain into upstream/.**
   - Current: ~/.bun/install/global/gbrain/ (bun global install, source is there)
   - Target: ~/hermes-control-plane/upstream/gbrain/
   - Method: find the actual source (bun stores it), copy it in
   - Alternative: `git clone https://github.com/garrytan/gbrain.git` fresh into upstream/
   - gbrain is a bun/TS project, not Python. The installed CLI at ~/.bun/bin/gbrain is the compiled output, we want the source.

7. **Move patches.**
   - Move `docs/patches/webui-ollama-provider.patch` → `patches/webui-ollama-provider.patch`
   - Keep `docs/patches/webui-ollama-provider.md` as documentation reference
   - OR consolidate: have patches/ contain both .patch and .md side by side

8. **Update all scripts.**
   - `scripts/start.sh` references ~/hermes-webui → update to $REPO_ROOT/upstream/hermes-webui
   - `scripts/status.sh` references ~/hermes-webui → same
   - `scripts/bootstrap.sh` references ~/hermes-webui clone step → change to copy from upstream/
   - `scripts/evolve.sh` references ~/hermes-agent-self-evolution → $REPO_ROOT/upstream/self-evolution

9. **Create CREDITS.md.**
   ```
   # Credits
   
   This project builds on the work of these creators:
   
   | Component | Creator | Repo | License |
   |-----------|---------|------|---------|
   | hermes-webui | @nesquena | https://github.com/nesquena/hermes-webui | MIT |
   | gbrain | @garrytan | https://github.com/garrytan/gbrain | MIT |
   | self-evolution | NousResearch | https://github.com/NousResearch/hermes-agent-self-evolution | MIT |
   | browser-use | @browser-use | https://github.com/browser-use/browser-use | MIT |
   | hermes-agent | NousResearch | https://github.com/NousResearch/hermes-agent | MIT |
   | bun | @oven-sh | https://github.com/oven-sh/bun | MIT |
   ```

10. **Update README.md** — add CREDITS section, update file paths in architecture diagram.

11. **Update STATUS.md** — fix directory layout to reflect upstream/ structure.

12. **Update docs/ROADMAP.md** — the project structure section needs to match the new layout.

13. **Verify everything still works.**
    - Run scripts/start.sh — webui should start from new path
    - Run scripts/status.sh — all health checks should pass
    - Test gbrain: `gbrain search "governance harness"`
    - Test webui: curl localhost:8787/health
    - Test self-evolution can still find hermes-agent

14. **Commit and push.** One clean commit with the restructure.

### What NOT to vendor

- **hermes-agent** — lives at ~/.hermes/hermes-agent/, is the running agent infrastructure. Too big (1.2GB), too coupled to ~/.hermes/ state. Don't move it. It's a runtime dependency, not source we modify.
- **browser-use** — installed as a Python venv at ~/.browser-use-env/, not source we modify. The installed CLI is enough. Don't vendor just the venv.
- **bun** — a binary, not source. Just the runtime.

### Principles to Apply

- **P1 (Bridges/Modularity)** — vendored code stays in upstream/, our patches in patches/, our code in extensions/. Clear separation.
- **P3 (Pillage Don't Build)** — we didn't write the upstream code. We credit it, patch it, build on it.
- **P5 (Fix Pattern)** — the restructure solves the real problem: code is scattered across ~/ and not in our repo.
- **P6 (Secrets Stay Secret)** — when vendoring, check for any .env files or credentials in upstream source. The webui repo has no secrets, gbrain has no secrets, self-evolution has no secrets. But VERIFY.
- **P7 (Framework Survives)** — vendored code means we control our copy. Upstream changes don't break us.

### Disk Budget

Windows C: drive had ~22GB free as of this session. Vendoring adds:
- hermes-webui: ~8.4MB (small)
- self-evolution: small
- gbrain: small (TS project)

Total added: probably under 50MB. No problem.

### Known Issues to Verify

- The webui Ollama patch (commit 1c2c3ac) must survive the move. Verify by checking `api/onboarding.py` for "ollama" in `_SUPPORTED_PROVIDER_SETUPS` after moving.
- gbrain's source location under bun may vary. Find it with: `bun pm ls -g` or check `~/.bun/install/global/`
- Scripts use hardcoded ~/hermes-webui path — every reference must be updated to $REPO_ROOT/upstream/hermes-webui
- self-evolution was installed into hermes-agent venv via `uv pip install -e ~/hermes-agent-self-evolution[dev]` — after moving, the editable install will break. Re-run: `uv pip install -e ~/hermes-control-plane/upstream/self-evolution[dev] --python ~/.hermes/hermes-agent/venv/bin/python`

### After Restructuring: Next Priority (Phase 1)

Once the repo is restructured, the next work is Phase 1 (Brain Integration) per ROADMAP.md:
- Write gbrain skill for hermes-agent (brain-first lookup before responding)
- Set up gbrain cron recipes (daily sync/embed/doctor)
- Build brain panel in webui (gbrain search, entity detection)
- Migrate remaining wiki content into gbrain schema

---

## Environment Facts (verified this session)

- WSL2 Ubuntu on Windows 11
- Windows C: drive: ~22 GB free (CHECK AGAIN — this was from `Get-Volume`)
- RAM: 32GB, VRAM: 16GB
- WSL2 disk space reports its own virtual disk (895GB) — NOT real Windows disk space. Use PowerShell `Get-Volume` for real numbers.
- Python: 3.12 (system), 3.11 (hermes venv)
- Node: v22.22.1, Bun: v1.3.12
- uv: installed at ~/.local/bin/uv
- No Docker installed (design choice: direct execution, Docker deferred to Phase 5)
- No sudo without terminal password (blocks apt installs, workaround: python zipfile for binary installs)
- hermes-agent config: provider=custom, base_url=https://ollama.com/v1, model=glm-5.1
- hermes .env has OLLAMA_API_KEY set (working)
- hermes sessions: 945+ jsonl files in ~/.hermes/sessions/
- gbrain: 9 pages from ~/wiki/ imported, 0 embeddings (needs OPENAI_API_KEY for vector search)

## Files Changed This Session (not in control-plane repo)

- ~/hermes-webui/api/onboarding.py — Ollama provider patch (17 lines added)
- ~/hermes-webui/api/config.py — Ollama key resolution patch (4 lines added)
- ~/.hermes/memories/MEMORY.md — cleaned up stale wiki references, added control plane + gbrain entries

## Git History (control-plane repo)

```
19c0fe3 Add actual patch file for webui Ollama provider fix
b3e1265 Add webui Ollama provider patch documentation to control-plane repo
cab8f9c Doc audit: fix stale Docker references, reconcile with direct-execution reality
1690d36 Document webui Ollama provider fix + update known gaps
68addbe Phase 0 complete: all services installed, wired, and verified
344cf87 Phase 0.1: Initial roadmap, principles, architecture, integrations, status
```