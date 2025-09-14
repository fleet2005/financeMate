'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Portfolio } from '@/lib/entities/Portfolio';

interface PortfolioChartProps {
  portfolios: Portfolio[];
}

interface ChartData {
  name: string;
  value: number;
  symbol: string;
  gainLoss: number;
  gainLossPercentage: number;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export default function PortfolioChart({ portfolios }: PortfolioChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  useEffect(() => {
    if (portfolios.length > 0) {
      const data = portfolios
        .filter(portfolio => portfolio.totalValue && Number(portfolio.totalValue) > 0)
        .map((portfolio, index) => ({
          name: portfolio.symbol.split('.')[0], // Remove exchange suffix for cleaner display
          value: Number(portfolio.totalValue) || 0,
          symbol: portfolio.symbol,
          gainLoss: Number(portfolio.totalGainLoss) || 0,
          gainLossPercentage: Number(portfolio.gainLossPercentage) || 0,
          color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value); // Sort by value descending

      setChartData(data);
    }
  }, [portfolios]);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        symbol: string;
        value: number;
        gainLoss: number;
        gainLossPercentage: number;
      };
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.symbol}</p>
          <p className="text-slate-300">
            Value: <span className="text-white">₹{data.value.toFixed(2)}</span>
          </p>
          <p className={`text-sm ${
            data.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            P&L: ₹{data.gainLoss.toFixed(2)} ({data.gainLossPercentage.toFixed(2)}%)
          </p>
        </div>
      );
    }
    return null;
  };


  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p>No portfolio data available for charting</p>
          <p className="text-sm mt-1">Add stocks and update prices to see your portfolio distribution</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex justify-center">
        <div className="bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setChartType('pie')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              chartType === 'pie'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
            suppressHydrationWarning
          >
            Pie Chart
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
            suppressHydrationWarning
          >
            Bar Chart
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
        {chartData.map((item, index) => (
          <div key={item.symbol} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-slate-300 truncate">{item.name}</span>
            <span className="text-white font-medium">
              ₹{(item.value / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
