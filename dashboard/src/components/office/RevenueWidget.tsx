import { useState, useEffect } from 'react';

interface RevenueData {
  gross: number;
  commission: number;
  orderCount: number;
}

interface StoreRevenue {
  id: string;
  name: string;
  commission: number;
  revenue: {
    today: RevenueData;
    week: RevenueData;
    month: RevenueData;
    year: RevenueData;
  };
}

interface RevenueResponse {
  stores: StoreRevenue[];
  totals: {
    today: { commission: number; gross: number };
    week: { commission: number; gross: number };
    month: { commission: number; gross: number };
    year: { commission: number; gross: number };
  };
  meta: {
    storeCount: number;
    fetchedAt: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || '';

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function RevenueWidget() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shopify/revenue`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result: RevenueResponse = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Revenue fetch error:', err);
        setError('Unable to load revenue');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
    const interval = setInterval(fetchRevenue, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm border-t border-white/10 px-8 py-4">
        <div className="text-white/50 text-sm">Loading revenue data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm border-t border-white/10 px-8 py-4">
        <div className="text-white/50 text-sm">{error || 'No data'}</div>
      </div>
    );
  }

  // No stores configured
  if (data.stores.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm border-t border-white/10 px-8 py-4">
        <div className="text-white/40 text-sm">No Shopify stores configured</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm border-t border-white/10 px-8 py-4 z-30">
      <div className="flex items-center justify-between">
        {/* Store-by-store revenue */}
        <div className="flex items-center gap-8">
          {data.stores.map((store) => (
            <div key={store.id} className="flex items-center gap-4">
              <span className="text-white/70 font-medium">{store.name}</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-400">
                  Today: {formatCurrency(store.revenue.today.commission)}
                </span>
                <span className="text-white/40">|</span>
                <span className="text-blue-400">
                  Week: {formatCurrency(store.revenue.week.commission)}
                </span>
                <span className="text-white/40">|</span>
                <span className="text-purple-400">
                  Month: {formatCurrency(store.revenue.month.commission)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total commission (if multiple stores) */}
        {data.stores.length > 1 && (
          <div className="flex items-center gap-4 border-l border-white/20 pl-6">
            <span className="text-white/70 font-medium uppercase text-sm">Total</span>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="text-green-400">{formatCurrency(data.totals.today.commission)}</span>
              <span className="text-white/40">|</span>
              <span className="text-blue-400">{formatCurrency(data.totals.week.commission)}</span>
              <span className="text-white/40">|</span>
              <span className="text-purple-400">{formatCurrency(data.totals.month.commission)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
