'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { ExpenseCategory } from '@/lib/entities/Expense';
import BudgetModal from './BudgetModal';

interface Budget {
  id: string;
  category: ExpenseCategory;
  amount: number;
  month: string;
  description?: string;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

interface BudgetPanelProps {
  selectedMonth: number;
  selectedYear: number;
  filterByDate: boolean;
  refreshTrigger?: number; // Add this to trigger refresh when expenses change
}

export default function BudgetPanel({ selectedMonth, selectedYear, filterByDate, refreshTrigger }: BudgetPanelProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const fetchBudgets = async () => {
    try {
      // Always fetch current month budgets only
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const params = new URLSearchParams();
      params.append('month', currentMonth.toString());
      params.append('year', currentYear.toString());

      const response = await fetch(`/api/budgets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear, filterByDate, refreshTrigger]); // Add refreshTrigger to dependencies

  const handleBudgetCreated = () => {
    fetchBudgets();
    setShowBudgetModal(false);
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBudgets();
      } else {
        alert('Failed to delete budget');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const getCategoryColor = (category: ExpenseCategory) => {
    const colors = {
      [ExpenseCategory.FOOD]: 'bg-green-500/20 text-green-400 border border-green-500/30',
      [ExpenseCategory.TRANSPORT]: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      [ExpenseCategory.ENTERTAINMENT]: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      [ExpenseCategory.SHOPPING]: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
      [ExpenseCategory.BILLS]: 'bg-red-500/20 text-red-400 border border-red-500/30',
      [ExpenseCategory.HEALTHCARE]: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      [ExpenseCategory.EDUCATION]: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      [ExpenseCategory.TRAVEL]: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      [ExpenseCategory.OTHER]: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    };
    return colors[category] || colors[ExpenseCategory.OTHER];
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-yellow-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Budget Overview</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded"></div>
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Budget Overview</h2>
        <button
          onClick={() => setShowBudgetModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Set Budget</span>
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No budgets set</p>
          <p className="text-sm text-slate-500">Set budgets to track your spending goals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div key={budget.id} className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(budget.category)}`}>
                    {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                  </span>
                  {budget.isOverBudget && (
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <button
                  onClick={() => handleDeleteBudget(budget.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">
                    ₹{budget.spent.toFixed(2)} of ₹{Number(budget.amount).toFixed(2)}
                  </span>
                  <span className={`font-medium ${budget.isOverBudget ? 'text-red-400' : 'text-slate-300'}`}>
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(budget.percentage, budget.isOverBudget)}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className={`${budget.isOverBudget ? 'text-red-400' : 'text-slate-400'}`}>
                  {budget.isOverBudget ? `Over by ₹${Math.abs(budget.remaining).toFixed(2)}` : `Remaining: ₹${budget.remaining.toFixed(2)}`}
                </span>
                {budget.description && (
                  <span className="text-slate-500 text-xs">{budget.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showBudgetModal && (
        <BudgetModal
          onClose={() => setShowBudgetModal(false)}
          onBudgetCreated={handleBudgetCreated}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      )}
    </div>
  );
}
