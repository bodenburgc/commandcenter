# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kitchen Family Command Center - a React + TypeScript dashboard displayed on a 43" TCL TV in vertical orientation (1080x1920) via Fire TV Stick. Replaced a MagicMirror Raspberry Pi setup.

**Server**: Mac Mini (192.168.1.132)
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

**Both services required**: Dashboard proxies `/api/*` to API proxy via `vite.config.ts`.

## Architecture

**Frontend** (`dashboard/`): React 19 + TypeScript + Vite + Tailwind CSS
- `src/App.tsx` - Layout router (URL param `?layout=kitchen|glass|office`)
- `src/layouts/` - Full-page layout containers (KitchenDashboard, GlassDashboard)
- `src/components/` - UI widgets (Clock, Weather, Calendar, PhotoSlideshow, NewsStrip, etc.)
- `src/config/calendars.ts` - Calendar iCal URLs and colors

**Backend** (`api-proxy/`): Express.js
- `server.js` - Entry point, CORS, request logging, health endpoint
- `routes/calendars.js` - Fetches/aggregates 11 iCal feeds using node-ical
- `routes/news.js` - Fetches 4 RSS feeds with 15-min cache using rss-parser

**Scripts** (`scripts/`): iCloud photo sync via launchd plist

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/calendars` | GET | Aggregated family calendar events |
| `/api/news` | GET | Local news (MPR, Star Tribune, KARE11, St. Croix 360) |
| `/api/news/refresh` | POST | Force news cache refresh |
| `/api/health` | GET | Service health + uptime |

## Layout System

Layout selected via URL param or `VITE_LAYOUT` env var:
- `kitchen` - Vertical 1080x1920 for Fire TV (default)
- `glass` - Glass-effect overlay layout
- `office` - Work-focused (not yet implemented)

## External APIs

- **Weather**: Open-Meteo (no key required), hardcoded to River Falls, WI coordinates
- **Calendars**: Google Calendar + Outlook iCal feeds (private URLs in `calendars.ts`)
- **News**: RSS feeds from local Minnesota/Wisconsin sources

## Display URLs

- Kitchen: `http://192.168.1.132:5173?layout=kitchen`
- Office: `http://192.168.1.132:5173?layout=glass`
- API Health: `http://192.168.1.132:3001/api/health`
