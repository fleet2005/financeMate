'use client';

import { useState } from 'react';
import { Edit, Trash2, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { Portfolio } from '@/lib/entities/Portfolio';

interface PortfolioListProps {
  portfolios: Portfolio[];
  onPortfolioDeleted: () => void;
}

export default function PortfolioList({ portfolios, onPortfolioDeleted }: PortfolioListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: '',
    averagePrice: '',
    notes: '',
  });

  const handleEdit = (portfolio: Portfolio) => {
    setEditingId(portfolio.id);
    setEditForm({
      quantity: portfolio.quantity.toString(),
      averagePrice: portfolio.averagePrice.toString(),
      notes: portfolio.notes || '',
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: parseFloat(editForm.quantity),
          averagePrice: parseFloat(editForm.averagePrice),
          notes: editForm.notes || undefined,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        onPortfolioDeleted(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onPortfolioDeleted();
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatPercentage = (percentage: number | string | null | undefined) => {
    const numPercentage = Number(percentage);
    if (Number.isNaN(numPercentage) || numPercentage === null || numPercentage === undefined) {
      return '+0.00%';
    }
    return `${numPercentage >= 0 ? '+' : ''}${numPercentage.toFixed(2)}%`;
  };

  return (
    <div className="divide-y divide-slate-700">
      {portfolios.map((portfolio) => (
        <div key={portfolio.id} className="p-6 hover:bg-slate-750 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-white">{portfolio.symbol}</h3>
                <span className="text-slate-400 text-sm">{portfolio.companyName}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Quantity</p>
                  <p className="text-white font-medium">{portfolio.quantity}</p>
                </div>
                <div>
                  <p className="text-slate-400">Avg. Price</p>
                  <p className="text-white font-medium">₹{(Number(portfolio.averagePrice) || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Current Price</p>
                  <p className="text-white font-medium">
                    {portfolio.currentPrice && !Number.isNaN(Number(portfolio.currentPrice)) ? `₹${Number(portfolio.currentPrice).toFixed(2)}` : 'Click "Update Prices" to fetch current price'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Total Value</p>
                  <p className="text-white font-medium">
                    {portfolio.totalValue && !Number.isNaN(Number(portfolio.totalValue)) ? formatCurrency(portfolio.totalValue) : 
                     portfolio.currentPrice && !Number.isNaN(Number(portfolio.currentPrice)) ? formatCurrency(Number(portfolio.quantity) * Number(portfolio.currentPrice)) : 
                     'Update prices to calculate'}
                  </p>
                </div>
              </div>

              {portfolio.totalGainLoss !== null && portfolio.totalGainLoss !== undefined && !Number.isNaN(Number(portfolio.totalGainLoss)) && (
                <div className="mt-3 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {Number(portfolio.totalGainLoss) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`font-medium ${
                      Number(portfolio.totalGainLoss) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(portfolio.totalGainLoss)}
                    </span>
                  </div>
                  
                  {portfolio.gainLossPercentage !== null && portfolio.gainLossPercentage !== undefined && !Number.isNaN(Number(portfolio.gainLossPercentage)) && (
                    <span className={`text-sm ${
                      Number(portfolio.gainLossPercentage) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercentage(portfolio.gainLossPercentage)}
                    </span>
                  )}
                </div>
              )}

              {portfolio.notes && (
                <div className="mt-2">
                  <p className="text-slate-400 text-sm">Notes:</p>
                  <p className="text-slate-300 text-sm">{portfolio.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {editingId === portfolio.id ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="Quantity"
                    className="w-20 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                    suppressHydrationWarning
                  />
                  <input
                    type="number"
                    value={editForm.averagePrice}
                    onChange={(e) => setEditForm(prev => ({ ...prev, averagePrice: e.target.value }))}
                    placeholder="Avg Price"
                    className="w-24 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                    suppressHydrationWarning
                  />
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleSaveEdit(portfolio.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-slate-600 text-white px-2 py-1 rounded text-xs hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(portfolio)}
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                    title="Edit portfolio"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(portfolio.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete portfolio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Portfolio Entry</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this portfolio entry? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
