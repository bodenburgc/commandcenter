import express from 'express';

export const remindersRouter = express.Router();

// In-memory storage for reminders (pushed from Apple Shortcut)
let cachedReminders = [];
let lastUpdated = null;

// GET /api/reminders - Serve reminders to dashboard
remindersRouter.get('/', (req, res) => {
  res.json({
    reminders: cachedReminders,
    meta: {
      count: cachedReminders.length,
      lastUpdated: lastUpdated,
      fetchedAt: new Date().toISOString(),
    },
  });
});

// POST /api/reminders - Receive reminders from Apple Shortcut
remindersRouter.post('/', express.json(), (req, res) => {
  try {
    const { reminders } = req.body;

    if (!Array.isArray(reminders)) {
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Expected { reminders: [...] }',
      });
    }

    // Normalize and store reminders
    cachedReminders = reminders.map(r => ({
      id: r.id || r.title, // Use title as fallback ID
      title: r.title || 'Untitled',
      notes: r.notes || null,
      dueDate: r.dueDate || r.due || null,
      priority: r.priority || 0, // 0 = none, 1 = low, 2 = medium, 3 = high (Apple uses 1-9, we normalize)
      isCompleted: r.isCompleted || r.completed || false,
      list: r.list || 'Family',
    }));

    lastUpdated = new Date().toISOString();

    console.log(`Received ${cachedReminders.length} reminders from Apple Shortcut`);

    res.json({
      success: true,
      count: cachedReminders.length,
      receivedAt: lastUpdated,
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    res.status(500).json({
      error: 'Failed to process reminders',
      message: error.message,
    });
  }
});

// DELETE /api/reminders - Clear reminders
remindersRouter.delete('/', (req, res) => {
  cachedReminders = [];
  lastUpdated = null;
  res.json({ message: 'Reminders cleared' });
});
