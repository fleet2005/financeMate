'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, RefreshCw, BarChart3, Newspaper } from 'lucide-react';
import { Portfolio } from '@/lib/entities/Portfolio';
import AddPortfolioModal from '@/components/AddPortfolioModal';
import PortfolioList from '@/components/PortfolioList';
import PortfolioChart from '@/components/PortfolioChart';

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);

  // Helper function to safely format numbers
  const safeNumber = (value: unknown): number => {
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolios');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched portfolios data:', data);
        setPortfolios(data);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioAdded = () => {
    fetchPortfolios();
    setShowAddModal(false);
  };

  const handlePortfolioDeleted = () => {
    fetchPortfolios();
  };

  const handleUpdatePrices = async () => {
    setUpdatingPrices(true);
    try {
      console.log('Starting price update...');
      const response = await fetch('/api/portfolios/update-prices', {
        method: 'POST',
      });
      
      console.log('Price update response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Price update result:', result);
        await fetchPortfolios(); // Refresh the portfolio list
      } else {
        const errorData = await response.json();
        console.error('Price update failed:', errorData);
        alert(`Failed to update prices: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      alert('Error updating prices. Please check the console for details.');
    } finally {
      setUpdatingPrices(false);
    }
  };

  const totalValue = portfolios.reduce((sum, portfolio) => {
    let value = safeNumber(portfolio.totalValue);
    
    if (value === 0) {
      // If totalValue is not available, calculate from current price and quantity
      const currentPrice = safeNumber(portfolio.currentPrice);
      const quantity = safeNumber(portfolio.quantity);
      value = currentPrice * quantity;
    }
    
    return sum + value;
  }, 0);
  
  const totalGainLoss = portfolios.reduce((sum, portfolio) => {
    return sum + safeNumber(portfolio.totalGainLoss);
  }, 0);
  
  const totalGainLossPercentage = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                suppressHydrationWarning
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </a>
              <div className="h-6 w-px bg-slate-600"></div>
              <h1 className="text-2xl font-bold text-white">Portfolio Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleUpdatePrices}
                disabled={updatingPrices || portfolios.length === 0}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                suppressHydrationWarning
              >
                <RefreshCw className={`h-4 w-4 ${updatingPrices ? 'animate-spin' : ''}`} />
                <span>Update Prices</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                suppressHydrationWarning
              >
                <Plus className="h-4 w-4" />
                <span>Add Stock</span>
              </button>
              <a
                href="/catch-up"
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                title="Catch up on latest finance news"
                suppressHydrationWarning
              >
                <Newspaper className="h-4 w-4" />
                <span>Catch-up</span>
              </a>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-white">₹{safeNumber(totalValue).toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{safeNumber(totalGainLoss).toFixed(2)}
                </p>
              </div>
              {totalGainLoss >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Gain/Loss %</p>
                <p className={`text-2xl font-bold ${totalGainLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {safeNumber(totalGainLossPercentage).toFixed(2)}%
                </p>
              </div>
              {totalGainLossPercentage >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Chart */}
        {portfolios.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Portfolio Performance</h2>
            <PortfolioChart portfolios={portfolios} />
          </div>
        )}

        {/* Portfolio List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Your Holdings</h2>
            <p className="text-slate-400 mt-1">Track your stock investments and performance</p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading portfolios...</p>
            </div>
          ) : portfolios.length === 0 ? (
            <div className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No stocks in your portfolio</h3>
              <p className="text-slate-400 mb-4">Start building your portfolio by adding your first stock</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Your First Stock
              </button>
            </div>
          ) : (
            <PortfolioList 
              portfolios={portfolios} 
              onPortfolioDeleted={handlePortfolioDeleted}
            />
          )}
        </div>
      </div>

      {/* Add Portfolio Modal */}
      {showAddModal && (
        <AddPortfolioModal
          onClose={() => setShowAddModal(false)}
          onPortfolioAdded={handlePortfolioAdded}
        />
      )}
    </div>
  );
}
