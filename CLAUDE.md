# Kitchen Family Command Center

A custom family dashboard replacing the old MagicMirror Raspberry Pi setup. Built with React + TypeScript + Vite, displayed on a 43" TCL TV in vertical/portrait orientation (1080x1920) via Fire TV Stick.

## Project Overview

**Owner**: Corby Bodenburg
**Display**: 43" TCL in Kitchen (vertical orientation)
**Server**: Mac Mini (192.168.1.132)
**Display Device**: Fire TV Stick + Fully Kiosk Browser

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mac Mini Server                         │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   API Proxy     │    │     Vite Dev Server             │ │
│  │   (port 3001)   │◄───│     (port 5173)                 │ │
│  │                 │    │                                 │ │
│  │ • /api/calendars│    │     React Dashboard             │ │
│  │ • /api/news     │    │     - KitchenDashboard.tsx      │ │
│  └────────┬────────┘    └─────────────────────────────────┘ │
│           │                           │                      │
│           ▼                           ▼                      │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ External APIs   │    │     Fire TV Stick               │ │
│  │ • Google Cal    │    │     (Fully Kiosk Browser)       │ │
│  │ • Outlook       │    │     http://192.168.1.132:5173   │ │
│  │ • RSS Feeds     │    │     ?layout=kitchen             │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Vertical Layout (1080x1920)

```
+------------------+  1080px wide
|   CLOCK/DATE     |  180px
+------------------+
|    WEATHER       |  220px
|  Current + 5-day |
+------------------+
|                  |
|    CALENDAR      |  ~950px (flex-1)
|   11 calendars   |
|   color-coded    |
|                  |
+------------------+
|   NEWS TICKER    |  100px
+------------------+
|   PHOTO STRIP    |  470px
+------------------+
```

## Quick Start

### 1. Start the API Proxy

```bash
cd api-proxy
npm install
npm start
```

This runs on port 3001 and handles:
- Fetching 11 family calendars (iCal)
- Fetching local news (RSS)

### 2. Start the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:5173?layout=kitchen` for the Kitchen display.

### 3. Set Up Photo Sync (Optional)

1. Create an iCloud Shared Album
2. Enable "Public Website" in album settings
3. Edit `scripts/sync-icloud-photos.sh` with your album token
4. Run manually or install the LaunchAgent for auto-sync

## Components

### Kitchen Layout
- **KitchenDashboard.tsx** - Main vertical layout container
- **GlassClock.tsx** - Time and date display (reused from Glass layout)
- **KitchenWeather.tsx** - Current weather + 5-day forecast
- **KitchenCalendar.tsx** - 11 family calendars, grouped by day
- **NewsStrip.tsx** - Rotating local news headlines
- **PhotoStrip.tsx** - Photo slideshow at bottom

### Calendars (11 total)

| Calendar | Owner | Color |
|----------|-------|-------|
| Home | Family | Cyan |
| Kristine | Kristine | Pink |
| KristineWork | Kristine | Purple |
| Corby | Corby | Green |
| CorbyWork | Corby | Indigo |
| CorbyBode | Corby | Teal |
| McCoy | McCoy | Yellow |
| Knox | Knox | Red |
| Ripley | Ripley | Orange |
| Holidays | US Holidays | Gray |
| Wrestling | Sports | Purple |

## File Structure

```
magicmirror-office/
├── dashboard/                 # React frontend
│   ├── src/
│   │   ├── layouts/
│   │   │   ├── GlassDashboard.tsx    # Original glass layout
│   │   │   └── KitchenDashboard.tsx  # NEW vertical layout
│   │   ├── components/
│   │   │   ├── KitchenCalendar.tsx   # 11 family calendars
│   │   │   ├── KitchenWeather.tsx    # Weather + forecast
│   │   │   ├── NewsStrip.tsx         # News ticker
│   │   │   └── PhotoStrip.tsx        # Photo slideshow
│   │   ├── config/
│   │   │   └── calendars.ts          # Calendar URLs & colors
│   │   └── App.tsx                   # Layout switching
│   └── public/
│       └── photos/                   # Photo storage
│
├── api-proxy/                 # Node.js backend
│   ├── server.js
│   └── routes/
│       ├── calendars.js      # iCal fetching & parsing
│       └── news.js           # RSS fetching & parsing
│
├── scripts/
│   ├── sync-icloud-photos.sh         # Photo sync script
│   └── com.bodenburg.*.plist         # LaunchAgent for scheduling
│
└── homeassistant/             # Home Assistant config (existing)
```

## Environment Variables

Dashboard (.env):
```env
VITE_LAYOUT=kitchen           # Default layout
VITE_API_URL=                 # Empty = use Vite proxy
```

## URLs

- **Kitchen Display**: `http://192.168.1.132:5173?layout=kitchen`
- **Office Display**: `http://192.168.1.132:5173?layout=glass`
- **API Health**: `http://192.168.1.132:3001/api/health`
- **Home Assistant**: `http://192.168.1.132:8123`

## Migration Notes

Migrated from MagicMirror (Raspberry Pi) to React dashboard:
- Calendar URLs preserved from original `config.js`
- Weather uses same Open-Meteo API (no key needed)
- Location: River Falls, WI (44.8614, -92.6277)
- Photo slideshow migrated (was Google Photos, now iCloud Shared Album)
- News feeds: MPR News, Star Tribune

## Future: Office Display

The Office display will be separate and work-focused:
- Horizontal layout (standard 1080p)
- Work calendars only (Corby, CorbyWork, CorbyBode)
- Nest cameras grid
- Thermostat & energy monitor
- No family photos/news

## Troubleshooting

### Calendar not loading
1. Check API proxy is running: `curl http://localhost:3001/api/health`
2. Check proxy logs for iCal fetch errors
3. Verify calendar URLs are still valid

### Photos not showing
1. Check `/dashboard/public/photos/` has images named `photo1.jpg`, etc.
2. For iCloud sync, check `/tmp/icloud-photos-sync.log`

### Layout switching not working
- URL param: `?layout=kitchen` or `?layout=glass`
- Or set `VITE_LAYOUT` in `.env`
