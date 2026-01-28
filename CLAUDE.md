# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Command Center - a React + TypeScript dashboard displayed on multiple screens:
- **Kitchen**: TCL 43" TV in vertical orientation (1080x1920) via Fire TV Stick
- **Office**: Samsung UN55F9000AFXZA 55" 4K TV (3840x2160, landscape orientation)

**Server**: KnownHost VPS (dashboard.bode.design)
**Location**: River Falls, WI (44.8614, -92.6277)

## Development Commands

```bash
# Dashboard (React frontend) - runs on port 5173
cd dashboard
npm run dev      # Start Vite dev server
npm run build    # TypeScript compile + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build

# API Proxy (Node.js backend) - runs on port 3001
cd api-proxy
npm start        # Start server
npm run dev      # Start with --watch for auto-reload
```

**Both services required**: Dashboard proxies `/api/*` to API proxy via `vite.config.ts` (dev) or `.htaccess` (production).

## Architecture

**Frontend** (`dashboard/`): React 19 + TypeScript + Vite + Tailwind CSS
- `src/App.tsx` - Layout router (URL param `?layout=kitchen|office`)
- `src/layouts/KitchenDashboard.tsx` - Vertical layout with photo background, calendar, weather, news
- `src/layouts/OfficeDashboard.tsx` - Horizontal layout with glassmorphism style
- `src/components/` - UI widgets (GlassClock, KitchenWeather, KitchenCalendar, NewsStrip, PhotoStrip, etc.)
- `src/config/calendars.ts` - Calendar colors by name (URLs are in api-proxy/.env)

**Backend** (`api-proxy/`): Express.js
- `server.js` - Entry point, CORS, request logging, health endpoint
- `routes/calendars.js` - Fetches/aggregates 11 iCal feeds using node-ical (5-min cache)
- `routes/news.js` - Fetches 4 RSS feeds with 15-min cache using rss-parser
- `.env` - Calendar iCal URLs (`CAL_HOME_URL`, `CAL_KRISTINE_URL`, etc.)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/calendars` | GET | Aggregated family calendar events (5-min cache) |
| `/api/news` | GET | Local news headlines (15-min cache) |
| `/api/news/refresh` | POST | Force news cache refresh |
| `/api/tasks` | GET | Google Tasks lists (5-min cache) |
| `/api/tasks/:listName` | GET | Tasks from specific list (scales, bode) |
| `/api/tasks/refresh` | POST | Force tasks cache refresh |
| `/api/shopify/revenue` | GET | Shopify store revenue metrics (15-min cache) |
| `/api/shopify/revenue/:storeId` | GET | Revenue for specific store |
| `/api/shopify/revenue/refresh` | POST | Force revenue cache refresh |
| `/api/health` | GET | Service health + uptime |

## Layout System

Layout selected via URL param or `VITE_LAYOUT` env var:
- `kitchen` - Vertical 1080x1920 for Fire TV (default)
- `office` - Horizontal layout for office monitor

**Kitchen layout URL params:**
- `?rotate=90|270` - Rotate content for landscape-to-portrait displays
- `?scale=0.2-1.5` - Scale content (default 0.4 when rotated, 1 otherwise)

**Keyboard shortcuts** (for scale adjustment):
- `+` or `=` - Increase scale
- `-` - Decrease scale
- `0` - Reset to default

## External APIs

- **Weather**: Open-Meteo (no key required), hardcoded to River Falls, WI coordinates
- **Calendars**: Google Calendar + Outlook iCal feeds (URLs in `api-proxy/.env`, colors in `calendars.ts`)
- **News**: RSS feeds from local Minnesota/Wisconsin sources

## Deployment

**Production server**: KnownHost VPS (dashboard.bode.design)
- User: `dashboard`
- Document root: `~/public_html/`
- API location: `~/api-proxy/`
- Photos: `~/photos/` (symlinked to `~/public_html/photos/`)
- Logs: `~/logs/photo-sync.log`

**Server stability**: VPS has 421+ days uptime (as of Jan 2026), reboots are rare.

```bash
# Deploy from dev machine
cd dashboard && npm run build
rsync -avz --delete dashboard/dist/ dashboard@dashboard.bode.design:~/public_html/
rsync -avz --exclude 'node_modules' api-proxy/ dashboard@dashboard.bode.design:~/api-proxy/

# On VPS: manage API
ssh dashboard@dashboard.bode.design
pm2 list                    # Check status
pm2 restart commandcenter-api   # Restart API
pm2 logs commandcenter-api      # View logs
```

**Process management**: pm2 (auto-restarts on crash)
- `pm2 save` - Save process list
- `pm2 startup` - Configure auto-start on reboot (requires sudo)

**Apache/LiteSpeed proxy**: `.htaccess` in `public_html/` proxies `/api/*` to Node.js on port 3001

## Photo Sync

Photos are synced from an iCloud **shared album** ("CommandKitchen") to the VPS.

**Shared album URL**: https://www.icloud.com/sharedalbum/#B2K5oqs3qeWNHl

```bash
# Manual sync
~/sync-shared-album.sh

# Cron job runs hourly (at :00)
crontab -l
```

**Features:**
- Downloads new photos from shared album
- Auto-deletes photos removed from the album
- Generates `photos.json` for the dashboard
- Logs to `~/logs/photo-sync.log`

**To add/remove photos**: Edit the shared album in the Photos app on any Apple device.

## Display URLs

| Display | URL |
|---------|-----|
| Kitchen (TCL 43" Fire TV) | `https://dashboard.bode.design?layout=kitchen&rotate=270` |
| Office (Samsung 55" 4K TV) | `https://dashboard.bode.design?layout=office` |
| API Health | `https://dashboard.bode.design/api/health` |

## Office Layout

The office layout (`?layout=office`) features a Netflix-style dashboard for 4K landscape displays.

**Features**:
- Photo background with configurable rotation interval
- Horizontal scrolling content shelves
- Work calendar integration (Google Calendar via iCal)
- Google Tasks integration (two lists from separate Google accounts: Scales, BODE)
- Shopify revenue widget showing commission from multiple client stores

**Office-specific components** (`src/components/office/`):
- `OfficeHeader.tsx` - Clock and date header
- `WorkCalendarShelf.tsx` - Calendar events in shelf format
- `TodoShelf.tsx` / `TodoCard.tsx` - Task lists display
- `RevenueWidget.tsx` - Shopify commission tracker
- `ContentShelf.tsx` / `CalendarCard.tsx` - Reusable shelf components

## Environment Variables

Required environment variables in `api-proxy/.env`:

```bash
# Calendar iCal URLs (11 calendars)
CAL_HOME_URL=https://calendar.google.com/calendar/ical/...
CAL_KRISTINE_URL=...
CAL_WORK_URL=...
# ... additional calendar URLs

# Google Tasks - Scales account
TASKS_SCALES_LIST_ID=your-list-id
GOOGLE_SCALES_CLIENT_ID=your-client-id
GOOGLE_SCALES_CLIENT_SECRET=your-client-secret
GOOGLE_SCALES_REFRESH_TOKEN=your-refresh-token

# Google Tasks - BODE account
TASKS_BODE_LIST_ID=your-list-id
GOOGLE_BODE_CLIENT_ID=your-client-id
GOOGLE_BODE_CLIENT_SECRET=your-client-secret
GOOGLE_BODE_REFRESH_TOKEN=your-refresh-token

# Shopify stores (supports: FISHARMOR, KEYBAR, HOLEMOLE, SLAMMERMARINE)
SHOPIFY_FISHARMOR_STORE=fisharmor.myshopify.com
SHOPIFY_FISHARMOR_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_FISHARMOR_COMMISSION=0.03
# Repeat pattern for other stores...
```
