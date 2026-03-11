#!/bin/bash
# Start all IIS services in separate terminal tabs/panes

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting IIS services...${NC}"
echo ""

# Kill any processes on our ports first
for PORT in 3001 5173 1337 50051; do
  PID=$(lsof -ti tcp:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo -e "${YELLOW}Killing process on port $PORT (PID $PID)${NC}"
    kill -9 $PID 2>/dev/null
  fi
done

sleep 1

# Start each service in a new iTerm2 tab
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

open_tab "IIS: gRPC (50051)"    "$ROOT/grpc-server"     "npm run dev"
sleep 0.5
open_tab "IIS: Backend (3001)"  "$ROOT/backend"         "npm run dev"
sleep 0.5
open_tab "IIS: Strapi (1337)"   "$ROOT/strapi-instance" "npm run dev"
sleep 0.5
open_tab "IIS: Frontend (5173)" "$ROOT/frontend"        "npm run dev"

echo ""
echo -e "${GREEN}All services starting:${NC}"
echo "  Frontend  → http://localhost:5173"
echo "  Backend   → http://localhost:3001"
echo "  GraphQL   → http://localhost:3001/graphql"
echo "  SOAP      → http://localhost:3001/soap?wsdl"
echo "  Strapi    → http://localhost:1337/admin"
echo "  gRPC      → localhost:50051"
echo ""
echo "Done."
