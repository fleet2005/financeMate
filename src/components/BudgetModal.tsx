'use client';

import { useState } from 'react';
import { X, Target } from 'lucide-react';
import { ExpenseCategory } from '@/lib/entities/Expense';

interface BudgetModalProps {
  onClose: () => void;
  onBudgetCreated: () => void;
  selectedMonth?: number;
  selectedYear?: number;
}

export default function BudgetModal({ onClose, onBudgetCreated, selectedMonth, selectedYear }: BudgetModalProps) {
  // Always use current month for budget creation
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const [formData, setFormData] = useState({
    category: ExpenseCategory.FOOD,
    amount: '',
    description: '',
    month: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        onBudgetCreated();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create budget');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Set Budget</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(ExpenseCategory).map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">
              Budget Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="month" className="block text-sm font-medium text-slate-300 mb-1">
              Month
            </label>
            <input
              type="text"
              id="month"
              value={`${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}`}
              disabled
              className="w-full bg-slate-600 border border-slate-500 text-slate-300 rounded-md px-3 py-2 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Budgets can only be set for the current month. If a budget already exists for this category, the amounts will be added together.</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
