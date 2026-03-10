#!/bin/bash
# Stop all IIS services by killing processes on their ports

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping IIS services...${NC}"
echo ""

STOPPED=0

for PORT in 3001 5173 1337 50051; do
  PID=$(lsof -ti tcp:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo -e "  Killing port $PORT (PID $PID)"
    kill -9 $PID 2>/dev/null
    STOPPED=$((STOPPED + 1))
  fi
done

echo ""
if [ $STOPPED -eq 0 ]; then
  echo -e "${YELLOW}No services were running.${NC}"
else
  echo -e "${GREEN}Stopped $STOPPED service(s).${NC}"
fi
echo ""
