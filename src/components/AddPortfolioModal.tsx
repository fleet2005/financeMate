'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';

interface AddPortfolioModalProps {
  onClose: () => void;
  onPortfolioAdded: () => void;
}

interface StockSuggestion {
  symbol: string;
  name: string;
}

export default function AddPortfolioModal({ onClose, onPortfolioAdded }: AddPortfolioModalProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    companyName: '',
    quantity: '',
    averagePrice: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockSuggestions, setStockSuggestions] = useState<StockSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const popularStocks = [
    { symbol: 'RELIANCE.BSE', name: 'Reliance Industries' },
    { symbol: 'TCS.BSE', name: 'Tata Consultancy Services' },
    { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank' },
    { symbol: 'INFY.BSE', name: 'Infosys' },
    { symbol: 'HINDUNILVR.BSE', name: 'Hindustan Unilever' },
    { symbol: 'ITC.BSE', name: 'ITC Limited' },
    { symbol: 'SBIN.BSE', name: 'State Bank of India' },
    { symbol: 'BHARTIARTL.BSE', name: 'Bharti Airtel' },
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    // Show suggestions when typing symbol
    if (name === 'symbol' && value.length > 0) {
      const filtered = popularStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(value.toLowerCase()) ||
        stock.name.toLowerCase().includes(value.toLowerCase())
      );
      setStockSuggestions(filtered);
      setShowSuggestions(true);
    } else if (name === 'symbol' && value.length === 0) {
      setShowSuggestions(false);
    }
  };

  const handleStockSelect = (stock: StockSuggestion) => {
    setFormData(prev => ({
      ...prev,
      symbol: stock.symbol,
      companyName: stock.name,
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: formData.symbol,
          companyName: formData.companyName,
          quantity: parseFloat(formData.quantity),
          averagePrice: parseFloat(formData.averagePrice),
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        onPortfolioAdded();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add portfolio');
      }
    } catch {
      setError('Failed to add portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Add Stock to Portfolio</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="relative">
            <label htmlFor="symbol" className="block text-sm font-medium text-slate-300 mb-2">
              Stock Symbol *
            </label>
            <div className="relative">
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="e.g., RELIANCE.BSE, AAPL"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                suppressHydrationWarning
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
            
            {showSuggestions && stockSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {stockSuggestions.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => handleStockSelect(stock)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-600 text-white border-b border-slate-600 last:border-b-0"
                    suppressHydrationWarning
                  >
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-sm text-slate-400">{stock.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="e.g., Reliance Industries"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              suppressHydrationWarning
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="10"
                min="0.01"
                step="0.01"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                suppressHydrationWarning
              />
            </div>

            <div>
              <label htmlFor="averagePrice" className="block text-sm font-medium text-slate-300 mb-2">
                Average Price (₹) *
              </label>
              <input
                type="number"
                id="averagePrice"
                name="averagePrice"
                value={formData.averagePrice}
                onChange={handleInputChange}
                placeholder="2500.00"
                min="0.01"
                step="0.01"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any notes about this investment..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              suppressHydrationWarning
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
