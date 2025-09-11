'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Expense, ExpenseCategory } from '@/lib/entities/Expense';

interface ExpenseSummaryProps {
  expenses: Expense[];
}

export default function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: amount,
    percentage: ((amount / expenses.reduce((sum, e) => sum + Number(e.amount), 0)) * 100).toFixed(1)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1'];

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const averageExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <h2 className="text-lg font-semibold text-white mb-4">Spending Summary</h2>
      
      {expenses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No expenses to display</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Spent:</span>
              <span className="font-semibold text-white">${totalSpent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Transactions:</span>
              <span className="font-semibold text-white">{expenses.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Average:</span>
              <span className="font-semibold text-white">${averageExpense.toFixed(2)}</span>
            </div>
          </div>

          {/* Pie Chart */}
          {chartData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-white">By Category</h3>
            {chartData
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
              .map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-medium text-white">${item.value.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
