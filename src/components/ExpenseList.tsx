'use client';

import { useState } from 'react';
import { Trash2, DollarSign } from 'lucide-react';
import { Expense, ExpenseCategory } from '@/lib/entities/Expense';
import { format } from 'date-fns';

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseDeleted: () => void;
}

export default function ExpenseList({ expenses, onExpenseDeleted }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onExpenseDeleted();
      } else {
        alert('Failed to delete expense');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setDeletingId(null);
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

  if (expenses.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center border border-slate-700">
        <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No expenses found</h3>
        <p className="text-slate-400">
          {expenses.length === 0 
            ? "Start tracking your expenses by adding your first one!"
            : "Try adjusting your filters to see more expenses."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
      </div>
      
      <div className="divide-y divide-slate-700">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-6 hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-white">{expense.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                    {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                  </span>
                </div>
                
                {expense.description && (
                  <p className="text-sm text-slate-400 mt-1">{expense.description}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-slate-500">
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-xl font-bold text-white">
                  ₹{Number(expense.amount).toFixed(2)}
                </span>
                
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
