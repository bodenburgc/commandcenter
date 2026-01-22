import express from 'express';

export const shopifyRouter = express.Router();

// Cache for revenue data
let cachedRevenue = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Store configuration from environment
// Format: SHOPIFY_{STORENAME}_STORE, SHOPIFY_{STORENAME}_ACCESS_TOKEN, SHOPIFY_{STORENAME}_COMMISSION
function getStoreConfigs() {
  const stores = [];
  const storeNames = ['FISHARMOR', 'KEYBAR', 'HOLEMOLE', 'SLAMMERMARINE'];

  for (const name of storeNames) {
    const store = process.env[`SHOPIFY_${name}_STORE`];
    const accessToken = process.env[`SHOPIFY_${name}_ACCESS_TOKEN`];
    const commission = parseFloat(process.env[`SHOPIFY_${name}_COMMISSION`] || '0.03');

    if (store && accessToken) {
      stores.push({
        id: name.toLowerCase(),
        name: name.charAt(0) + name.slice(1).toLowerCase(),
        store,
        accessToken,
        commission,
      });
    }
  }

  return stores;
}

// Calculate date ranges for revenue queries
function getDateRanges() {
  const now = new Date();

  // Today (start of day)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Week (7 days ago)
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  // Month (30 days ago)
  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);
  monthStart.setHours(0, 0, 0, 0);

  // Year (365 days ago)
  const yearStart = new Date(now);
  yearStart.setDate(yearStart.getDate() - 365);
  yearStart.setHours(0, 0, 0, 0);

  return { todayStart, weekStart, monthStart, yearStart };
}

// Fetch orders from Shopify Admin API
async function fetchOrders(storeConfig, createdAtMin) {
  const url = `https://${storeConfig.store}/admin/api/2024-01/orders.json?status=any&created_at_min=${createdAtMin.toISOString()}&limit=250`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': storeConfig.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error for ${storeConfig.name}:`, response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error(`Error fetching orders for ${storeConfig.name}:`, error.message);
    return [];
  }
}

// Calculate revenue from orders
function calculateRevenue(orders, startDate, commission) {
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startDate &&
           order.financial_status !== 'refunded' &&
           order.financial_status !== 'voided';
  });

  const gross = filteredOrders.reduce((sum, order) => {
    return sum + parseFloat(order.total_price || 0);
  }, 0);

  // Apply tiered commission (3% up to $200k, 1.5% above)
  let commissionAmount;
  if (gross > 200000) {
    commissionAmount = (200000 * commission) + ((gross - 200000) * (commission / 2));
  } else {
    commissionAmount = gross * commission;
  }

  return {
    gross: Math.round(gross * 100) / 100,
    commission: Math.round(commissionAmount * 100) / 100,
    orderCount: filteredOrders.length,
  };
}

// Fetch revenue for a single store
async function fetchStoreRevenue(storeConfig) {
  const { todayStart, weekStart, monthStart, yearStart } = getDateRanges();

  // Fetch all orders from the past year (we'll filter for shorter periods)
  const orders = await fetchOrders(storeConfig, yearStart);

  return {
    id: storeConfig.id,
    name: storeConfig.name,
    commission: storeConfig.commission,
    revenue: {
      today: calculateRevenue(orders, todayStart, storeConfig.commission),
      week: calculateRevenue(orders, weekStart, storeConfig.commission),
      month: calculateRevenue(orders, monthStart, storeConfig.commission),
      year: calculateRevenue(orders, yearStart, storeConfig.commission),
    },
  };
}

// Main endpoint - get revenue from all stores
shopifyRouter.get('/revenue', async (req, res) => {
  try {
    const now = Date.now();

    // Use cache if valid
    if (cachedRevenue && now - cacheTimestamp < CACHE_DURATION) {
      console.log('Returning cached Shopify revenue data');
      return res.json(cachedRevenue);
    }

    const storeConfigs = getStoreConfigs();

    // Check if any stores are configured
    if (storeConfigs.length === 0) {
      return res.json({
        stores: [],
        totals: { today: 0, week: 0, month: 0 },
        meta: {
          storeCount: 0,
          message: 'No Shopify stores configured. Set SHOPIFY_FISHARMOR_STORE and SHOPIFY_FISHARMOR_ACCESS_TOKEN in .env',
          fetchedAt: new Date().toISOString(),
        },
      });
    }

    console.log(`Fetching revenue data from ${storeConfigs.length} Shopify store(s)...`);

    // Fetch revenue from all stores in parallel
    const stores = await Promise.all(
      storeConfigs.map(config => fetchStoreRevenue(config))
    );

    // Calculate totals across all stores
    const totals = {
      today: {
        commission: stores.reduce((sum, s) => sum + s.revenue.today.commission, 0),
        gross: stores.reduce((sum, s) => sum + s.revenue.today.gross, 0),
      },
      week: {
        commission: stores.reduce((sum, s) => sum + s.revenue.week.commission, 0),
        gross: stores.reduce((sum, s) => sum + s.revenue.week.gross, 0),
      },
      month: {
        commission: stores.reduce((sum, s) => sum + s.revenue.month.commission, 0),
        gross: stores.reduce((sum, s) => sum + s.revenue.month.gross, 0),
      },
      year: {
        commission: stores.reduce((sum, s) => sum + s.revenue.year.commission, 0),
        gross: stores.reduce((sum, s) => sum + s.revenue.year.gross, 0),
      },
    };

    const response = {
      stores,
      totals,
      meta: {
        storeCount: stores.length,
        fetchedAt: new Date().toISOString(),
      },
    };

    // Update cache
    cachedRevenue = response;
    cacheTimestamp = now;

    res.json(response);
  } catch (error) {
    console.error('Shopify revenue endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch Shopify revenue',
      message: error.message,
    });
  }
});

// Get revenue for a specific store
shopifyRouter.get('/revenue/:storeId', async (req, res) => {
  try {
    const storeId = req.params.storeId.toLowerCase();
    const storeConfigs = getStoreConfigs();
    const storeConfig = storeConfigs.find(s => s.id === storeId);

    if (!storeConfig) {
      return res.status(404).json({
        error: 'Store not found',
        available: storeConfigs.map(s => s.id),
      });
    }

    const storeRevenue = await fetchStoreRevenue(storeConfig);

    res.json({
      ...storeRevenue,
      meta: {
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Shopify revenue endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch Shopify revenue',
      message: error.message,
    });
  }
});

// Force refresh endpoint
shopifyRouter.post('/revenue/refresh', async (req, res) => {
  cachedRevenue = null;
  cacheTimestamp = 0;
  res.json({ message: 'Shopify revenue cache cleared, next request will fetch fresh data' });
});
