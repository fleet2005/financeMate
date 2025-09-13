'use client';

import { useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';

interface StockSelectorProps {
  selectedStock: string;
  onStockSelect: (symbol: string) => void;
  loading: boolean;
}

// Popular stocks (works with both Alpha Vantage and Yahoo Finance)
const popularStocks = [
  // Indian Stocks (Yahoo Finance format - more reliable)
  { symbol: 'RELIANCE.BSE', name: 'Reliance Industries' },
  { symbol: 'TCS.BSE', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank' },
  { symbol: 'INFY.BSE', name: 'Infosys' },
  { symbol: 'HINDUNILVR.BSE', name: 'Hindustan Unilever' },
  { symbol: 'ITC.BSE', name: 'ITC Limited' },
  { symbol: 'SBIN.BSE', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL.BSE', name: 'Bharti Airtel' },
  // US Stocks (works with both APIs)
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble' },
  { symbol: 'UNH', name: 'UnitedHealth Group' }
];

export default function StockSelector({ selectedStock, onStockSelect, loading }: StockSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredStocks = popularStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStockInfo = popularStocks.find(stock => stock.symbol === selectedStock);

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search stocks (e.g., AAPL, MSFT, BSE:RELIANCE)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              suppressHydrationWarning
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      onStockSelect(stock.symbol);
                      setSearchTerm('');
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{stock.name}</p>
                        <p className="text-slate-400 text-sm">{stock.symbol}</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-slate-400">
                  No stocks found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Stock Display */}
        {selectedStockInfo && (
          <div className="flex items-center space-x-3 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-white font-medium">{selectedStockInfo.name}</p>
              <p className="text-slate-400 text-sm">{selectedStockInfo.symbol}</p>
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            )}
          </div>
        )}
      </div>

      {/* Popular Stocks Quick Select */}
      <div className="mt-4">
        <p className="text-sm text-slate-400 mb-2">Popular Stocks:</p>
        <div className="flex flex-wrap gap-2">
          {popularStocks.slice(0, 8).map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => onStockSelect(stock.symbol)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedStock === stock.symbol
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              suppressHydrationWarning
            >
              {stock.symbol.split('.')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
