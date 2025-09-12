'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Plus, TrendingUp, DollarSign, Calendar, Filter } from 'lucide-react';
import { Expense, ExpenseCategory } from '@/lib/entities/Expense';
import AddExpenseModal from './AddExpenseModal';
import UploadReceiptModal from './UploadReceiptModal';
import ExpenseList from './ExpenseList';
import ExpenseSummary from './ExpenseSummary';
import SuggestionsPanel from './SuggestionsPanel';

interface Suggestion {
  type: 'savings' | 'warning' | 'tip' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [filterByDate, setFilterByDate] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Set current date after component mounts to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, []);

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (filterByDate) {
        params.append('month', selectedMonth.toString());
        params.append('year', selectedYear.toString());
      }

      const response = await fetch(`/api/expenses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const params = new URLSearchParams();
      params.append('month', selectedMonth.toString());
      params.append('year', selectedYear.toString());

      const response = await fetch(`/api/suggestions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchExpenses(), fetchSuggestions()]);
      setLoading(false);
    };
    loadData();
  }, [mounted, selectedCategory, selectedMonth, selectedYear, filterByDate]);

  const handleExpenseAdded = () => {
    fetchExpenses();
    fetchSuggestions();
    setShowAddModal(false);
  };

  const handleExpenseDeleted = () => {
    fetchExpenses();
    fetchSuggestions();
  };

  const handleReceiptCreated = () => {
    // Always refetch from DB to ensure UI matches server
    fetchExpenses();
    fetchSuggestions();
    setShowUploadModal(false);
  };

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">FinanceMate</h1>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Spent</p>
                <p className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Transactions</p>
                <p className="text-2xl font-bold text-white">{expenses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Add Button */}
        <div suppressHydrationWarning className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <select suppressHydrationWarning
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.values(ExpenseCategory).map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date filter toggle */}
            <label className="flex items-center space-x-2 text-sm text-slate-400">
              <input
                suppressHydrationWarning
                type="checkbox"
                checked={filterByDate}
                onChange={(e) => setFilterByDate(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              <span>Filter by month/year</span>
            </label>

            {mounted && filterByDate && (
              <div className="flex space-x-2">
                <select suppressHydrationWarning
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleDateString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>

                <select suppressHydrationWarning
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button suppressHydrationWarning
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Scan Receipt</span>
            </button>
            <button suppressHydrationWarning
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center border border-slate-700">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-slate-400">Loading expenses...</p>
              </div>
            ) : (
              <ExpenseList
                expenses={expenses}
                onExpenseDeleted={handleExpenseDeleted}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ExpenseSummary expenses={expenses} />
            <SuggestionsPanel suggestions={suggestions} />
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal
          onClose={() => setShowAddModal(false)}
          onExpenseAdded={handleExpenseAdded}
        />
      )}

      {/* Upload Receipt Modal */}
      {showUploadModal && (
        <UploadReceiptModal
          onClose={() => setShowUploadModal(false)}
          onCreated={handleReceiptCreated}
        />
      )}
    </div>
  );
}
