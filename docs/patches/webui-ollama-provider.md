# WebUI Ollama Provider Patch

Local patch applied to `upstream/hermes-webui/`. Patch file: `patches/webui-ollama-provider.patch`

## Patch 1: Ollama Provider Recognition

**Commit:** `1c2c3ac` on ~/hermes-webui
**Date:** 2026-04-12
**Files:** `api/onboarding.py`, `api/config.py`

### Root Cause
WebUI's onboarding only recognized 4 providers (openrouter, anthropic, openai, custom) and checked `OPENAI_API_KEY` for custom endpoints. Ollama Cloud uses `OLLAMA_API_KEY`. Result: webui saw `provider: custom` + `OLLAMA_API_KEY` but couldn't match them → "still needs API key" despite hermes-agent working fine.

### Changes

**api/onboarding.py (13 lines added):**
- Added `ollama` to `_SUPPORTED_PROVIDER_SETUPS` with `env_var: OLLAMA_API_KEY`
- `_extract_current_provider()` remaps `custom→ollama` when base_url contains "ollama"

**api/config.py (4 lines added):**
- Added `OLLAMA_API_KEY` to fallback env var scan (line 663)
- Added `OLLAMA_API_KEY` to custom endpoint key resolution chain (line 745)
- Added `ollama` to detected_providers when key found (line 684)

### Verification
Before: `provider_ready=false, chat_ready=false, setup_state=provider_incomplete`
After: `provider_ready=true, chat_ready=true, setup_state=ready, current_provider=ollama`

### Rebase Note
If hermes-webui upstream is pulled, this commit may need re-applying. The changes are purely additive (no deletions, no modifications to existing lines) so `git rebase` should apply cleanly. If it doesn't, re-apply the same 17 lines manually.

### Upstream PR Potential
This fix is general — any user with `OLLAMA_API_KEY` and an ollama base_url hits the same bug. Could submit as upstream PR to nesquena/hermes-webui.