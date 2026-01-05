#!/bin/bash
#
# iCloud Shared Album Photo Sync Script
# ======================================
# Downloads photos from an iCloud Shared Album to the dashboard photos folder.
#
# SETUP INSTRUCTIONS:
# 1. Create an iCloud Shared Album on your iPhone/Mac
# 2. Add photos you want to display on the dashboard
# 3. Enable "Public Website" in the album settings
# 4. Copy the share URL (looks like: https://www.icloud.com/sharedalbum/#B0aG5abcDEF)
# 5. Extract the album token (the part after #, e.g., B0aG5abcDEF)
# 6. Set ALBUM_TOKEN below to that value
#
# RUN MANUALLY:
#   ./scripts/sync-icloud-photos.sh
#
# SCHEDULE WITH LAUNCHD:
#   See the LaunchAgent plist in this directory
#

# Configuration
ALBUM_TOKEN="${ICLOUD_ALBUM_TOKEN:-YOUR_ALBUM_TOKEN_HERE}"
PHOTO_DIR="/Users/cbodenburg/Sites/commandcenter/dashboard/public/photos"
TEMP_DIR="/tmp/icloud-photos-sync"
MAX_PHOTOS=50
LOG_FILE="/tmp/icloud-photos-sync.log"

# Logging function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if token is configured
if [[ "$ALBUM_TOKEN" == "YOUR_ALBUM_TOKEN_HERE" ]]; then
  log "ERROR: Please configure ALBUM_TOKEN in this script or set ICLOUD_ALBUM_TOKEN env var"
  log "See setup instructions at the top of this script"
  exit 1
fi

log "Starting iCloud photo sync..."
log "Album token: ${ALBUM_TOKEN:0:5}..."
log "Output directory: $PHOTO_DIR"

# Create directories
mkdir -p "$TEMP_DIR"
mkdir -p "$PHOTO_DIR"

# iCloud Shared Album API endpoint
# This is the undocumented API that the public website uses
BASE_URL="https://p${ALBUM_TOKEN:0:2}-sharedstreams.icloud.com/${ALBUM_TOKEN}/sharedstreams"

# Fetch the webstream data (list of assets)
log "Fetching album metadata..."
WEBSTREAM=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"streamCtag":null}' \
  "${BASE_URL}/webstream")

if [[ -z "$WEBSTREAM" || "$WEBSTREAM" == *"error"* ]]; then
  log "ERROR: Failed to fetch album data. Check your album token."
  log "Response: $WEBSTREAM"
  exit 1
fi

# Parse photo GUIDs from the response
PHOTO_GUIDS=$(echo "$WEBSTREAM" | grep -o '"photoGuid":"[^"]*"' | cut -d'"' -f4 | head -n $MAX_PHOTOS)

if [[ -z "$PHOTO_GUIDS" ]]; then
  log "No photos found in album"
  exit 0
fi

PHOTO_COUNT=$(echo "$PHOTO_GUIDS" | wc -l | tr -d ' ')
log "Found $PHOTO_COUNT photos in album"

# Request asset URLs
log "Fetching photo URLs..."
GUID_JSON=$(echo "$PHOTO_GUIDS" | awk '{printf "{\"photoGuid\":\"%s\"}%s", $0, (NR=='"$PHOTO_COUNT"'?"":",\n")}')
ASSET_REQUEST="{\"photoGuids\":[$GUID_JSON]}"

ASSETS=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$ASSET_REQUEST" \
  "${BASE_URL}/webasseturls")

if [[ -z "$ASSETS" ]]; then
  log "ERROR: Failed to fetch asset URLs"
  exit 1
fi

# Clean temp directory
rm -f "$TEMP_DIR"/*.jpg "$TEMP_DIR"/*.jpeg "$TEMP_DIR"/*.png 2>/dev/null

# Parse and download each photo
log "Downloading photos..."
DOWNLOADED=0

# Extract URLs from response (format: "url_location": "checksum:path")
echo "$ASSETS" | grep -o '"[^"]*":"[^"]*"' | while read -r line; do
  # Parse the URL path
  URL_PATH=$(echo "$line" | cut -d'"' -f4)

  if [[ "$URL_PATH" == *".jpg"* || "$URL_PATH" == *".jpeg"* || "$URL_PATH" == *".png"* ]]; then
    DOWNLOADED=$((DOWNLOADED + 1))
    FILENAME="photo${DOWNLOADED}.jpg"
    FULL_URL="https://${URL_PATH}"

    log "  Downloading: $FILENAME"
    curl -s -L -o "$TEMP_DIR/$FILENAME" "$FULL_URL"
  fi
done

# Count downloaded files
DOWNLOADED=$(ls -1 "$TEMP_DIR"/*.jpg 2>/dev/null | wc -l | tr -d ' ')
log "Downloaded $DOWNLOADED photos"

if [[ $DOWNLOADED -gt 0 ]]; then
  # Clear old photos and copy new ones
  log "Updating photo directory..."
  rm -f "$PHOTO_DIR"/photo*.jpg "$PHOTO_DIR"/photo*.jpeg "$PHOTO_DIR"/photo*.png 2>/dev/null

  # Rename and move photos
  i=1
  for photo in "$TEMP_DIR"/*.jpg; do
    if [[ -f "$photo" ]]; then
      cp "$photo" "$PHOTO_DIR/photo${i}.jpg"
      i=$((i + 1))
    fi
  done

  FINAL_COUNT=$((i - 1))
  log "Synced $FINAL_COUNT photos to $PHOTO_DIR"
else
  log "No photos downloaded, keeping existing photos"
fi

# Cleanup
rm -rf "$TEMP_DIR"

log "iCloud photo sync complete!"
