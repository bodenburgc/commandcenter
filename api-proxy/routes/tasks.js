import express from 'express';
import { google } from 'googleapis';

export const tasksRouter = express.Router();

// Cache for tasks data
let cachedTasks = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Task list configuration from environment (supports multiple Google accounts)
const TASK_LISTS = [
  {
    id: process.env.TASKS_SCALES_LIST_ID,
    name: 'Scales',
    clientId: process.env.GOOGLE_SCALES_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SCALES_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_SCALES_REFRESH_TOKEN,
  },
  {
    id: process.env.TASKS_BODE_LIST_ID,
    name: 'BODE',
    clientId: process.env.GOOGLE_BODE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_BODE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_BODE_REFRESH_TOKEN,
  },
].filter(list => list.id && list.clientId && list.clientSecret && list.refreshToken);

// Create OAuth2 client for a specific account
function getOAuth2Client(listConfig) {
  const oauth2Client = new google.auth.OAuth2(listConfig.clientId, listConfig.clientSecret);
  oauth2Client.setCredentials({ refresh_token: listConfig.refreshToken });
  return oauth2Client;
}

// Fetch tasks from a single list (with subtask nesting)
async function fetchTaskList(listConfig) {
  const oauth2Client = getOAuth2Client(listConfig);
  const tasksApi = google.tasks({ version: 'v1', auth: oauth2Client });
  try {
    const response = await tasksApi.tasks.list({
      tasklist: listConfig.id,
      showCompleted: false,
      showHidden: false,
      maxResults: 100,
    });

    const allTasks = (response.data.items || []).map(task => ({
      id: task.id,
      title: task.title,
      notes: task.notes || null,
      due: task.due || null,
      completed: task.status === 'completed',
      position: task.position,
      parent: task.parent || null,
      subtasks: [],
    }));

    // Build task hierarchy - nest subtasks under parents
    const taskMap = new Map();
    allTasks.forEach(task => taskMap.set(task.id, task));

    const rootTasks = [];
    allTasks.forEach(task => {
      if (task.parent && taskMap.has(task.parent)) {
        // This is a subtask - add to parent's subtasks array
        taskMap.get(task.parent).subtasks.push(task);
      } else {
        // This is a root-level task
        rootTasks.push(task);
      }
    });

    // Sort root tasks and subtasks by position
    rootTasks.sort((a, b) => a.position?.localeCompare(b.position) || 0);
    rootTasks.forEach(task => {
      task.subtasks.sort((a, b) => a.position?.localeCompare(b.position) || 0);
    });

    return {
      id: listConfig.id,
      name: listConfig.name,
      tasks: rootTasks,
    };
  } catch (error) {
    console.error(`Error fetching task list ${listConfig.name}:`, error.message);
    return {
      id: listConfig.id,
      name: listConfig.name,
      tasks: [],
      error: error.message,
    };
  }
}

// Main endpoint - get all task lists
tasksRouter.get('/', async (req, res) => {
  try {
    const now = Date.now();

    // Use cache if valid
    if (cachedTasks && now - cacheTimestamp < CACHE_DURATION) {
      console.log('Returning cached tasks data');
      return res.json(cachedTasks);
    }

    // Check if any task lists are configured
    if (TASK_LISTS.length === 0) {
      return res.json({
        lists: [],
        meta: {
          count: 0,
          message: 'No task lists configured. Set TASKS_SCALES_LIST_ID and TASKS_BODE_LIST_ID in .env',
          fetchedAt: new Date().toISOString(),
        },
      });
    }

    console.log('Fetching fresh tasks data...');

    // Fetch all task lists in parallel (each with its own OAuth client)
    const lists = await Promise.all(
      TASK_LISTS.map(list => fetchTaskList(list))
    );

    const totalTasks = lists.reduce((sum, list) => sum + list.tasks.length, 0);

    const response = {
      lists,
      meta: {
        count: totalTasks,
        listCount: lists.length,
        fetchedAt: new Date().toISOString(),
      },
    };

    // Update cache
    cachedTasks = response;
    cacheTimestamp = now;

    res.json(response);
  } catch (error) {
    console.error('Tasks endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch tasks',
      message: error.message,
    });
  }
});

// Get tasks from a specific list
tasksRouter.get('/:listName', async (req, res) => {
  try {
    const listName = req.params.listName.toLowerCase();
    const listConfig = TASK_LISTS.find(l => l.name.toLowerCase() === listName);

    if (!listConfig) {
      return res.status(404).json({
        error: 'Task list not found',
        available: TASK_LISTS.map(l => l.name),
      });
    }

    const list = await fetchTaskList(listConfig);

    res.json({
      ...list,
      meta: {
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Tasks endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch tasks',
      message: error.message,
    });
  }
});

// Force refresh endpoint
tasksRouter.post('/refresh', async (req, res) => {
  cachedTasks = null;
  cacheTimestamp = 0;
  res.json({ message: 'Tasks cache cleared, next request will fetch fresh data' });
});
