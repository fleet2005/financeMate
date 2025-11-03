'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { TrendingUp, BarChart3, DollarSign, TrendingDown, ArrowLeft, Calculator } from 'lucide-react';
import StockChart from '@/components/StockChart';
import StockSelector from '@/components/StockSelector';
import BuyStrengthEvaluation from '@/components/BuyStrengthEvaluation';

interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  week52High: number;
  week52Low: number;
  marketCap: number | null;
  pe: number | null;
  dividend: number | null;
  sector: string | null;
  industry: string | null;
  description: string | null;
  historicalData: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export default function StocksPage() {
  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE.BSE');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('1mo');
  const [showEvaluation, setShowEvaluation] = useState(false);

  const fetchStockData = async (symbol: string, period: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stocks?symbol=${symbol}&period=${period}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stock data');
      }
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStock) {
      fetchStockData(selectedStock, period);
    }
  }, [selectedStock, period]);

  const formatNumber = (num: number) => {
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(1)}Cr`;
    } else if (num >= 100000) {
      return `${(num / 100000).toFixed(1)}L`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-white">Stock Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="flex items-center space-x-2 bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-600 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </a>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Selector */}
        <div className="mb-8">
          <StockSelector
            selectedStock={selectedStock}
            onStockSelect={setSelectedStock}
            loading={loading}
          />
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { value: '1d', label: '1D' },
              { value: '5d', label: '5D' },
              { value: '1mo', label: '1M' },
              { value: '3mo', label: '3M' },
              { value: '6mo', label: '6M' },
              { value: '1y', label: '1Y' },
              { value: '2y', label: '2Y' },
              { value: '5y', label: '5Y' }
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                suppressHydrationWarning
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        )}

        {stockData && (
          <>
            {/* Stock Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Current Price */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Current Price</p>
                    <p className="text-2xl font-bold text-white">₹{stockData.currentPrice}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
                <div className="mt-2 flex items-center">
                  {stockData.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    stockData.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ₹{Math.abs(stockData.change)} ({stockData.changePercent > 0 ? '+' : ''}{stockData.changePercent}%)
                  </span>
                </div>
              </div>

              {/* Previous Close */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Previous Close</p>
                    <p className="text-2xl font-bold text-white">₹{stockData.previousClose}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              {/* 52W High */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">52W High</p>
                    <p className="text-2xl font-bold text-white">₹{stockData.week52High}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </div>

              {/* 52W Low */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">52W Low</p>
                    <p className="text-2xl font-bold text-white">₹{stockData.week52Low}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-400" />
                </div>
              </div>
            </div>

            {/* Stock Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Chart */}
              <div className="lg:col-span-2">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {stockData.name} ({stockData.symbol})
                  </h3>
                  <StockChart data={stockData.historicalData} />
                </div>
              </div>

              {/* Stock Info */}
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Open</span>
                      <span className="text-white">₹{stockData.open}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">High</span>
                      <span className="text-white">₹{stockData.high}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Low</span>
                      <span className="text-white">₹{stockData.low}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Previous Close</span>
                      <span className="text-white">₹{stockData.previousClose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Volume</span>
                      <span className="text-white">{formatNumber(stockData.volume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Volume</span>
                      <span className="text-white">{formatNumber(stockData.avgVolume)}</span>
                    </div>
                    {stockData.pe && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">P/E Ratio</span>
                        <span className="text-white">{stockData.pe}</span>
                      </div>
                    )}
                    {stockData.dividend && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dividend Yield</span>
                        <span className="text-white">{stockData.dividend}%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Evaluate Button */}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowEvaluation(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                    >
                      <Calculator className="h-4 w-4" />
                      <span>Evaluate Buy Strength</span>
                    </button>
                  </div>
                </div>

                {stockData.sector && (
                  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Company Info</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400">Sector</span>
                        <p className="text-white">{stockData.sector}</p>
                      </div>
                      {stockData.industry && (
                        <div>
                          <span className="text-slate-400">Industry</span>
                          <p className="text-white">{stockData.industry}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Description */}
            {stockData.description && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">About {stockData.name}</h3>
                <p className="text-slate-300 leading-relaxed">{stockData.description}</p>
              </div>
            )}
          </>
        )}

        {/* Buy Strength Evaluation Modal */}
        {stockData && (
          <BuyStrengthEvaluation
            stockData={stockData}
            isOpen={showEvaluation}
            onClose={() => setShowEvaluation(false)}
          />
        )}
      </div>
    </div>
  );
}
