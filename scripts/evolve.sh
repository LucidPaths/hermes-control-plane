# Evolution trigger script
# Usage: ./evolve.sh <skill-name> [iterations] [eval-source]
# Example: ./evolve.sh github-code-review 10 sessiondb

#!/usr/bin/env bash
set -euo pipefail

SKILL="${1:?Usage: evolve.sh <skill-name> [iterations] [eval-source]}"
ITERATIONS="${2:-5}"
EVAL_SOURCE="${3:-synthetic}"
AGENT_DIR="${HERMES_AGENT_DIR:-$HOME/.hermes/hermes-agent}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVOLUTION_DIR="$REPO_ROOT/upstream/self-evolution"

export HERMES_AGENT_REPO="$AGENT_DIR"

echo "Evolving skill: $SKILL"
echo "  Iterations: $ITERATIONS"
echo "  Eval source: $EVAL_SOURCE"
echo ""

cd "$EVOLUTION_DIR"
"$AGENT_DIR/venv/bin/python" -m evolution.skills.evolve_skill \
    --skill "$SKILL" \
    --iterations "$ITERATIONS" \
    --eval-source "$EVAL_SOURCE"

echo ""
echo "Evolution complete. Check reports/ for results."