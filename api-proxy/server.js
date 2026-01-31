import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { calendarRouter } from './routes/calendars.js';
import { newsRouter } from './routes/news.js';
import { tasksRouter } from './routes/tasks.js';
import { shopifyRouter } from './routes/shopify.js';
import { remindersRouter } from './routes/reminders.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/calendars', calendarRouter);
app.use('/api/news', newsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/shopify', shopifyRouter);
app.use('/api/reminders', remindersRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   Family Command Center API Proxy                     ║
║   Running on http://localhost:${PORT}                    ║
║                                                       ║
║   Endpoints:                                          ║
║     GET /api/calendars      - Family calendar events  ║
║     GET /api/news           - Local news headlines    ║
║     GET /api/tasks          - Google Tasks lists      ║
║     GET /api/shopify/revenue - Shopify store revenue  ║
║     GET /api/health         - Service health check    ║
╚═══════════════════════════════════════════════════════╝
  `);
});
