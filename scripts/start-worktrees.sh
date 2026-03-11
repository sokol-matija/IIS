#!/bin/bash
# Generic script to start the frontend dev server in every git worktree.
# Skips the main worktree (where this script lives).
# Looks for a frontend/ or client/ subdirectory with a package.json.
# Ports start at BASE_PORT and increment by 1 per worktree.
#
# Usage: ./scripts/start-worktrees.sh [base_port]
#   base_port defaults to 5174

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE_PORT="${1:-5174}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

open_tab() {
  local title="$1"
  local dir="$2"
  local cmd="$3"
  osascript -e "
    tell application \"iTerm2\"
      activate
      tell current window
        create tab with default profile
        tell current session of current tab
          set name to \"$title\"
          write text \"cd '$dir' && $cmd\"
        end tell
      end tell
    end tell
  "
}

# Find the frontend dir inside a worktree (frontend/ or client/ with package.json)
find_frontend() {
  local wt="$1"
  for candidate in frontend client src .; do
    if [ -f "$wt/$candidate/package.json" ]; then
      echo "$wt/$candidate"
      return
    fi
  done
}

# Collect worktrees (skip main)
WORKTREES=()
while IFS= read -r line; do
  WORKTREES+=("$line")
done < <(git -C "$ROOT" worktree list --porcelain | awk '/^worktree /{print $2}' | grep -v "^$ROOT$")

if [ ${#WORKTREES[@]} -eq 0 ]; then
  echo "No additional worktrees found."
  exit 0
fi

echo -e "${GREEN}Starting worktree frontends...${NC}"
echo ""

PORT=$BASE_PORT
STARTED=()

for WT in "${WORKTREES[@]}"; do
  BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null || basename "$WT")
  FRONTEND=$(find_frontend "$WT")

  if [ -z "$FRONTEND" ]; then
    echo -e "${YELLOW}Skipping $BRANCH — no package.json found${NC}"
    continue
  fi

  # Kill anything already on this port
  PID=$(lsof -ti tcp:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo -e "${YELLOW}Killing process on port $PORT (PID $PID)${NC}"
    kill -9 $PID 2>/dev/null
  fi

  open_tab "$BRANCH (:$PORT)" "$FRONTEND" "npm run dev -- --port $PORT"
  STARTED+=("$BRANCH:$PORT")
  sleep 0.4
  PORT=$((PORT + 1))
done

echo ""
echo -e "${GREEN}Worktree previews starting:${NC}"
for entry in "${STARTED[@]}"; do
  BRANCH="${entry%:*}"
  PORT="${entry#*:}"
  echo -e "  ${CYAN}$BRANCH${NC} → http://localhost:$PORT"
done

# Wait for servers to be ready then open all in browser
echo ""
echo "Waiting for servers to be ready..."
for entry in "${STARTED[@]}"; do
  PORT="${entry#*:}"
  for i in $(seq 1 20); do
    if curl -s -o /dev/null "http://localhost:$PORT"; then
      break
    fi
    sleep 0.5
  done
  open "http://localhost:$PORT"
done

echo ""
echo "Done."
