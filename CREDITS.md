# Credits

This project builds on the work of these creators and their open-source projects.
All vendored code lives in `upstream/` with original license files intact.

| Component | Creator | Repository | License | Vendored In |
|-----------|---------|-----------|--------|-------------|
| **hermes-webui** | [@nesquena](https://github.com/nesquena) | [nesquena/hermes-webui](https://github.com/nesquena/hermes-webui) | MIT | `upstream/hermes-webui/` |
| **gbrain** | [@garrytan](https://github.com/garrytan) | [garrytan/gbrain](https://github.com/garrytan/gbrain) | MIT | `upstream/gbrain/` |
| **self-evolution** | [NousResearch](https://github.com/NousResearch) | [NousResearch/hermes-agent-self-evolution](https://github.com/NousResearch/hermes-agent-self-evolution) | MIT | `upstream/self-evolution/` |

## Runtime Dependencies (not vendored, installed separately)

| Component | Creator | Repository | License | Install |
|-----------|---------|-----------|--------|---------|
| **hermes-agent** | [NousResearch](https://github.com/NousResearch) | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | MIT | `scripts/bootstrap.sh` |
| **browser-use** | [@browser-use](https://github.com/browser-use) | [browser-use/browser-use](https://github.com/browser-use/browser-use) | MIT | `curl -fsSL https://browser-use.com/cli/install.sh \| bash` |
| **bun** | [@oven-sh](https://github.com/oven-sh) | [oven-sh/bun](https://github.com/oven-sh/bun) | MIT | `scripts/bootstrap.sh` |

## Our Modifications

All patches to vendored code are in `patches/` and documented in `docs/patches/`.

| Patch | Target | Description |
|-------|--------|-------------|
| [webui-ollama-provider.patch](patches/webui-ollama-provider.patch) | hermes-webui | Recognize Ollama as a first-class provider in onboarding wizard |

## Philosophy

We didn't write the upstream code. We credit it, we patch it, we build on it.
If upstream releases important changes, we cherry-pick manually.
See [PRINCIPLES.md](docs/PRINCIPLES.md) for our design philosophy (P3: Pillage, Don't Build).