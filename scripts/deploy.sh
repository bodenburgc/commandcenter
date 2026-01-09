#!/bin/bash
# Deploy Command Center to Mac Mini
# Usage: ./scripts/deploy.sh [--setup]

set -e

# Configuration
REMOTE_HOST="RiverFalls.local"  # Mac Mini hostname (or use 192.168.1.132)
REMOTE_USER="cbodenburg"
REMOTE_PATH="/Users/cbodenburg/Sites/commandcenter"
LOCAL_PATH="/Users/cbodenburg/Sites/commandcenter"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Command Center Deploy ===${NC}"
echo "Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
echo ""

# Check if we can reach the Mac Mini
if ! ping -c 1 -W 2 "$REMOTE_HOST" &> /dev/null; then
    echo -e "${RED}Error: Cannot reach Mac Mini at ${REMOTE_HOST}${NC}"
    exit 1
fi

# First-time setup
if [ "$1" == "--setup" ]; then
    echo -e "${YELLOW}Running first-time setup...${NC}"

    # Create directory on remote
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_PATH}"

    # Sync files
    echo "Syncing files..."
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude '.env' \
        --exclude 'homeassistant' \
        --exclude '.claude' \
        "${LOCAL_PATH}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

    # Install dependencies and build on remote
    echo -e "${YELLOW}Installing dependencies on Mac Mini...${NC}"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
        cd /Users/cbodenburg/Sites/commandcenter

        # Check for Node.js
        if ! command -v node &> /dev/null; then
            echo "Node.js not found. Install with: brew install node"
            exit 1
        fi

        echo "Node version: $(node -v)"

        # Install API proxy dependencies
        echo "Installing API proxy dependencies..."
        cd api-proxy && npm install

        # Install dashboard dependencies and build
        echo "Installing dashboard dependencies..."
        cd ../dashboard && npm install

        echo "Building dashboard..."
        npm run build
ENDSSH

    echo ""
    echo -e "${YELLOW}Setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Copy your .env file to the Mac Mini:"
    echo "   scp ${LOCAL_PATH}/api-proxy/.env ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/api-proxy/.env"
    echo ""
    echo "2. Install the launchd services on the Mac Mini:"
    echo "   ssh ${REMOTE_USER}@${REMOTE_HOST}"
    echo "   cp ~/Sites/commandcenter/scripts/com.bodenburg.commandcenter-*.plist ~/Library/LaunchAgents/"
    echo "   launchctl load ~/Library/LaunchAgents/com.bodenburg.commandcenter-api.plist"
    echo "   launchctl load ~/Library/LaunchAgents/com.bodenburg.commandcenter-dashboard.plist"
    echo ""
    exit 0
fi

# Regular deploy (not setup)
echo "Syncing files..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude 'homeassistant' \
    --exclude '.claude' \
    "${LOCAL_PATH}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo ""
echo -e "${YELLOW}Building on Mac Mini...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
    cd /Users/cbodenburg/Sites/commandcenter/dashboard
    npm run build
ENDSSH

echo ""
echo -e "${YELLOW}Restarting services...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" << 'ENDSSH'
    # Restart API proxy
    launchctl stop com.bodenburg.commandcenter-api 2>/dev/null || true
    launchctl start com.bodenburg.commandcenter-api 2>/dev/null || echo "API service not loaded"

    # Restart dashboard
    launchctl stop com.bodenburg.commandcenter-dashboard 2>/dev/null || true
    launchctl start com.bodenburg.commandcenter-dashboard 2>/dev/null || echo "Dashboard service not loaded"
ENDSSH

echo ""
echo -e "${GREEN}Deploy complete!${NC}"
echo ""
echo "Dashboard: http://${REMOTE_HOST}:5173"
echo "API Health: http://${REMOTE_HOST}:3001/api/health"
