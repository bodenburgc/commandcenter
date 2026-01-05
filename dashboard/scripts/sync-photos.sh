#!/bin/bash
# Sync photos from iCloud Shared Album to dashboard
# Album: CommandKitchen
# Anyone with access to this shared album can add photos

ALBUM_TOKEN="B2K5oqs3qeWNHl"
PHOTOS_DIR="/Users/cbodenburg/Sites/commandcenter/dashboard/public/photos"
TEMP_DIR="/tmp/icloud-photos-sync"

echo "Syncing photos from iCloud Shared Album..."

# Create directories
mkdir -p "$PHOTOS_DIR"
mkdir -p "$TEMP_DIR"

# Clear old photos
rm -f "$PHOTOS_DIR"/photo*.jpg "$PHOTOS_DIR"/photo*.jpeg "$PHOTOS_DIR"/photo*.png 2>/dev/null

# Step 1: Get the correct iCloud host via redirect
echo "Finding iCloud host..."
curl -s -X POST \
    "https://p01-sharedstreams.icloud.com/${ALBUM_TOKEN}/sharedstreams/webstream" \
    -H "Content-Type: application/json" \
    -d '{"streamCtag":null}' > "$TEMP_DIR/redirect.json"

# Check if we got a redirect host
HOST=$(python3 -c "
import json
with open('$TEMP_DIR/redirect.json') as f:
    data = json.load(f)
    host = data.get('X-Apple-MMe-Host', '')
    ctag = data.get('streamCtag', '')
    print(host)
" 2>/dev/null)

# Get ctag for subsequent request
CTAG=$(python3 -c "
import json
with open('$TEMP_DIR/redirect.json') as f:
    data = json.load(f)
    print(data.get('streamCtag', ''))
" 2>/dev/null)

if [ -z "$HOST" ]; then
    HOST="p01-sharedstreams.icloud.com"
fi

echo "Using host: $HOST"

# Step 2: Get full stream with ctag (to get all photos)
curl -s -X POST \
    "https://${HOST}/${ALBUM_TOKEN}/sharedstreams/webstream" \
    -H "Content-Type: application/json" \
    -d "{\"streamCtag\":\"$CTAG\"}" > "$TEMP_DIR/stream.json"

# Check if we got photos
if ! grep -q '"photos"' "$TEMP_DIR/stream.json"; then
    echo "Error: Could not fetch album data."
    exit 1
fi

# Step 3: Extract album name, photoGuids, and best checksums
python3 << 'PYTHON_SCRIPT'
import json

temp_dir = "/tmp/icloud-photos-sync"

with open(f"{temp_dir}/stream.json") as f:
    data = json.load(f)

print(f"Album: {data.get('streamName', 'Unknown')}")

photos = data.get('photos', [])

# Get photoGuids for the webasseturls request
photo_guids = [p.get('photoGuid') for p in photos if p.get('photoGuid')]

# Get best (largest) checksum for each photo
best_checksums = []
for p in photos:
    derivatives = p.get('derivatives', {})
    best = None
    best_size = 0
    for key, deriv in derivatives.items():
        size = int(deriv.get('fileSize', 0))
        if size > best_size:
            best_size = size
            best = deriv
    if best:
        best_checksums.append(best.get('checksum', ''))

# Write photoGuids for asset request
with open(f"{temp_dir}/asset_request.json", 'w') as f:
    json.dump({'photoGuids': photo_guids}, f)

# Write best checksums (to filter downloads later)
with open(f"{temp_dir}/best_checksums.txt", 'w') as f:
    for c in best_checksums:
        f.write(c + '\n')

print(f"Found {len(photo_guids)} photos")
PYTHON_SCRIPT

if [ ! -f "$TEMP_DIR/asset_request.json" ]; then
    echo "No photos found"
    exit 0
fi

# Step 4: Get asset URLs using photoGuids
curl -s -X POST \
    "https://${HOST}/${ALBUM_TOKEN}/sharedstreams/webasseturls" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_DIR/asset_request.json" > "$TEMP_DIR/assets.json"

# Step 5: Extract download URLs for best (largest) checksums only
python3 << 'PYTHON_SCRIPT'
import json

temp_dir = "/tmp/icloud-photos-sync"

# Read best checksums
with open(f"{temp_dir}/best_checksums.txt") as f:
    best_checksums = set(line.strip() for line in f if line.strip())

# Read asset URLs
with open(f"{temp_dir}/assets.json") as f:
    data = json.load(f)

items = data.get('items', {})

# Write URLs for best checksums only
with open(f"{temp_dir}/urls.txt", 'w') as f:
    for checksum in best_checksums:
        if checksum in items:
            info = items[checksum]
            scheme = info.get('url_scheme', 'https')
            host = info.get('url_location', '')
            path = info.get('url_path', '')
            if host and path:
                f.write(f"{scheme}://{host}{path}\n")

print(f"Generated URLs for {len(best_checksums)} photos")
PYTHON_SCRIPT

# Step 6: Download photos
counter=1
while read -r url; do
    if [ -n "$url" ]; then
        echo "Downloading photo $counter..."
        curl -s -L "$url" -o "$TEMP_DIR/photo${counter}.jpg"
        ((counter++))
    fi
done < "$TEMP_DIR/urls.txt"

# Move downloaded photos to photos directory
counter=1
for f in "$TEMP_DIR"/photo*.jpg; do
    if [ -f "$f" ] && [ -s "$f" ]; then
        mv "$f" "$PHOTOS_DIR/photo${counter}.jpg"
        ((counter++))
    fi
done

PHOTO_COUNT=$((counter-1))
echo "Synced $PHOTO_COUNT photos from iCloud Shared Album"

# Generate photos.json manifest
MANIFEST="$PHOTOS_DIR/photos.json"
echo "{" > "$MANIFEST"
echo "  \"count\": $PHOTO_COUNT," >> "$MANIFEST"
echo "  \"photos\": [" >> "$MANIFEST"
for i in $(seq 1 $PHOTO_COUNT); do
    if [ $i -eq $PHOTO_COUNT ]; then
        echo "    \"photo${i}.jpg\"" >> "$MANIFEST"
    else
        echo "    \"photo${i}.jpg\"," >> "$MANIFEST"
    fi
done
echo "  ]," >> "$MANIFEST"
echo "  \"lastSync\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" >> "$MANIFEST"
echo "}" >> "$MANIFEST"

echo "Manifest created with $PHOTO_COUNT photos"

# Cleanup
rm -rf "$TEMP_DIR"

echo "Done! Your wife can add photos to the shared album and run this script to sync."
