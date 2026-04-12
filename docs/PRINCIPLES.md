# Principles — Hermes Control Plane

Derived from HiveMind's Principle Lattice, adapted for the convergence layer. Every build decision checks against these. If a choice violates one, reconsider.

## P1: Bridges and Modularity
> One path, two systems. Lego blocks, not monoliths.

Each component (hermes-agent, webui, gbrain, evolution, browser-use) is an independent project with its own maintainers, releases, and upgrade path. We build bridges between them, not forks of them. The integration layer must be thin and replaceable.

**Instantiation:**
- Prefer `docker compose` and MCP bridges over forking and modifying upstream
- Prefer environment variables and config files over patching source
- When upstream releases a new version, `git pull && docker compose up` should work without merge conflicts
- If we must patch, patch in a layer (overlay, plugin, volume mount) not in the source

## P2: Provider Agnosticism
> The interface is permanent. The backend is replaceable.

hermes-agent works with any LLM provider. gbrain works with PGLite or Supabase. browser-use works with local Chromium or cloud browsers. The control plane must never couple to a specific provider for anything.

**Instantiation:**
- No hard-coded API keys, model names, or provider URLs in the control plane
- `config.yaml` is the single source of truth for provider configuration
- Every component must work with the cheapest free tier and scale to paid
- Switching from PGLite to Supabase is a config change, not a migration

## P3: Simplicity Wins (Pillage, Don't Build)
> Don't reinvent the wheel. Code exists to be used.

All five components already exist, are maintained, and have communities. Our job is wiring, not building. If something works upstream, use it. If something almost works, extend it. Only build what genuinely doesn't exist.

**Instantiation:**
- hermes-webui already has sessions, memory, skills, cron, workspace — we add panels, not features
- gbrain already has brain search and entity detection — we surface it, not reimplement it
- self-evolution already has the optimizer — we trigger it and display results
- Before writing any code, check if the upstream project has a plugin/extension point for what we need

## P4: Errors Are Answers
> Every failure teaches. Given a model, the program debugs itself.

The control plane must be observable. Every component logs. Every panel shows status. When something breaks, the system tells you what broke and why. Self-evolution exists precisely to turn failures into improvements.

**Instantiation:**
- Every Docker container logs to stdout, collected by a shared log stream
- webui panels show connection status, last sync time, error states
- self-evolution runs are triggered by patterns in error logs
- The dashboard answers "is it working?" in one glance

## P5: Fix The Pattern, Not The Symptom
> Cure the root cause. Don't treat symptoms.

When browser-use fails, fix the browser-use config, not catch the error in hermes-agent and retry. When gbrain returns stale results, trigger a sync, not patch the query. The controlplane exposes root causes; it doesn't paper over them.

**Instantiation:**
- Panels show the underlying state (connection health, sync timestamps, evolution scores)
- Error messages link to the failing component's logs
- Auto-heal only when the root cause is known (e.g., stale brain → `gbrain sync && gbrain embed --stale`)

## P6: Secrets Stay Secret
> Military-grade OPSEC. Nothing left open to exploitation.

This system has API keys for LLM providers, browser-use cloud, Supabase, email, calendar, and more. The control plane must never leak these to logs, UI, or external surfaces.

**Instantiation:**
- All secrets in `.env` or `config.yaml`, never in docker-compose.yml plaintext
- webui password auth enabled by default on any non-localhost connection
- SSH tunnel or Tailscale for remote access, never port forwarding
- gbrain's credential recipes follow their own validation before writing
- self-evolution never commits secrets in generated PRs

## P7: The Framework Survives
> Models evolve. The harness endures.

hermes-agent v1 → v2 → v3. gbrain v0.5 → v1.0. self-evolution Phase 1 → Phase 5. The control plane connects stable interfaces, not implementation details. When upstream refactors, we update the bridge config, not rewrite the bridge.

**Instantiation:**
- Docker image tags pin major versions (`hermes-webui:1.x`, not `:latest` in production)
- MCP protocol is the canonical integration surface (both gbrain and hermes-agent speak it)
- Volume mounts for persistent state (`~/.hermes/`, `~/.gbrain/`) survive container restarts

## P8: Low Floor, High Ceiling
> A noob can use it. A power user would want to.

`docker compose up` gives you a working system. Configuring browser-use cloud, Supabase, and self-evolution gives you a monster. Both must work.

**Instantiation:**
- Default compose file runs everything locally with zero API keys (PGLite, local browser, local models)
- Commented sections in `.env.example` for each integration with links to get keys
- webui onboarding detects what's configured and shows what's available
- gbrain works with keyword search alone (no API keys needed for basic operation)

## P9: Compounding Intelligence
> The system gets smarter the longer it runs. Every cycle adds knowledge.

This is gbrain's thesis. It's also self-evolution's thesis. The control plane must ensure the loop never breaks: signal arrives → entity detect → read brain → respond with context → write brain → sync for next query. Every interruption in this loop is a loss that compounds.

**Instantiation:**
- gbrain sync runs on cron, not just on demand
- hermes-agent reads brain before responding (skill-driven, not manual)
- self-evolution triggers on session accumulation, not manual kick-off
- The brain grows. The skills sharpen. The agent improves. All automatically.

## P10: Brain Over Memory
> World knowledge is separate from operational state. Both matter. Neither substitutes for the other.

gbrain = world knowledge (people, companies, meetings, ideas). hermes memory = operational state (preferences, corrections, session context). They're complementary. The control plane surfaces both, conflates neither.

**Instantiation:**
- Memory panel in webui shows MEMORY.md + USER.md (operational state)
- Brain panel shows gbrain search results (world knowledge)
- Search queries hit both systems, results are labeled by source
- Entity detection writes to brain, behavioral corrections write to memory