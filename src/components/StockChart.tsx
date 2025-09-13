'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  data: StockData[];
}

export default function StockChart({ data }: StockChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
    formattedDate: format(new Date(item.date), 'MMM dd, yyyy')
  }));

  // Calculate price range for better Y-axis scaling
  const prices = data.map(item => item.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const yAxisMin = Math.max(0, minPrice - priceRange * 0.1);
  const yAxisMax = maxPrice + priceRange * 0.1;

  // Custom tooltip
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        formattedDate: string;
        close: number;
        open: number;
        high: number;
        low: number;
        volume: number;
      };
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm mb-2">{data.formattedDate}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Close:</span>
              <span className="text-white font-medium">₹{data.close}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Open:</span>
              <span className="text-white">₹{data.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">High:</span>
              <span className="text-green-400">₹{data.high}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Low:</span>
              <span className="text-red-400">₹{data.low}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Volume:</span>
              <span className="text-slate-300 text-sm">
                {data.volume >= 1000000 
                  ? `${(data.volume / 1000000).toFixed(1)}M`
                  : data.volume >= 1000 
                    ? `${(data.volume / 1000).toFixed(1)}K`
                    : data.volume
                }
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Y-axis tick formatter
  const formatYAxisTick = (value: number) => {
    return `₹${value.toFixed(0)}`;
  };

  // Determine line color based on price trend
  const firstPrice = data[0]?.close || 0;
  const lastPrice = data[data.length - 1]?.close || 0;
  const isPositive = lastPrice >= firstPrice;
  const lineColor = isPositive ? '#10b981' : '#ef4444'; // green or red

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[yAxisMin, yAxisMax]}
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxisTick}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lineColor }}></div>
            <span>Closing Price</span>
          </div>
        </div>
        <div className="text-right">
          <p>Data Points: {data.length}</p>
          <p>Price Range: ₹{minPrice.toFixed(2)} - ₹{maxPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
