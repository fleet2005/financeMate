import { initializeDatabase } from './database';
import { Expense } from './entities/Expense';
import { Budget } from './entities/Budget';
import { Portfolio } from './entities/Portfolio';

export interface UserFinancialContext {
  expenses: {
    recent: Expense[];
    totalSpent: number;
    categoryBreakdown: Record<string, number>;
    monthlyTrend: { month: string; amount: number }[];
  };
  budgets: {
    current: Budget[];
    performance: Array<{
      category: string;
      budget: number;
      spent: number;
      percentage: number;
      isOverBudget: boolean;
    }>;
  };
  portfolios?: {
    totalValue: number;
    holdings: Array<{
      symbol: string;
      quantity: number;
      currentPrice: number;
      totalValue: number;
    }>;
  };
  insights: {
    topSpendingCategory: string;
    averageTransaction: number;
    budgetHealth: 'good' | 'warning' | 'critical';
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export class RAGService {
  static async getUserFinancialContext(userId: string): Promise<UserFinancialContext> {
    const dataSource = await initializeDatabase();
    
    // Get current date for filtering
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);

    // Fetch recent expenses (last 6 months)
    const expenseRepository = dataSource.getRepository(Expense);
    const recentExpenses = await expenseRepository
      .createQueryBuilder('expense')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date >= :sixMonthsAgo', { sixMonthsAgo })
      .orderBy('expense.date', 'DESC')
      .getMany();

    // Fetch current month's budgets
    const budgetRepository = dataSource.getRepository(Budget);
    const currentBudgets = await budgetRepository
      .createQueryBuilder('budget')
      .where('budget.userId = :userId', { userId })
      .andWhere('budget.month = :currentMonth', { currentMonth })
      .getMany();

    // Fetch portfolios (if any)
    const portfolioRepository = dataSource.getRepository(Portfolio);
    const portfolios = await portfolioRepository
      .createQueryBuilder('portfolio')
      .where('portfolio.userId = :userId', { userId })
      .getMany();

    // Calculate financial insights
    const totalSpent = recentExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    const categoryBreakdown = recentExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const topSpendingCategory = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    const averageTransaction = recentExpenses.length > 0 ? totalSpent / recentExpenses.length : 0;

    // Calculate monthly spending trend
    const monthlyTrend = this.calculateMonthlyTrend(recentExpenses);

    // Calculate budget performance
    const budgetPerformance = currentBudgets.map(budget => {
      const spent = categoryBreakdown[budget.category] || 0;
      const percentage = (spent / Number(budget.amount)) * 100;
      return {
        category: budget.category,
        budget: Number(budget.amount),
        spent,
        percentage,
        isOverBudget: spent > Number(budget.amount)
      };
    });

    // Determine budget health
    const overBudgetCount = budgetPerformance.filter(b => b.isOverBudget).length;
    const nearBudgetCount = budgetPerformance.filter(b => b.percentage >= 80 && !b.isOverBudget).length;
    
    let budgetHealth: 'good' | 'warning' | 'critical' = 'good';
    if (overBudgetCount > 0) budgetHealth = 'critical';
    else if (nearBudgetCount > 0) budgetHealth = 'warning';

    // Determine spending trend
    const spendingTrend = this.calculateSpendingTrend(monthlyTrend);

    // Calculate portfolio data
    let portfolioData;
    if (portfolios.length > 0) {
      const totalPortfolioValue = portfolios.reduce((sum, portfolio) => 
        sum + (Number(portfolio.quantity) * Number(portfolio.currentPrice)), 0);
      
      portfolioData = {
        totalValue: totalPortfolioValue,
        holdings: portfolios.map(portfolio => ({
          symbol: portfolio.symbol,
          quantity: Number(portfolio.quantity),
          currentPrice: Number(portfolio.currentPrice),
          totalValue: Number(portfolio.quantity) * Number(portfolio.currentPrice)
        }))
      };
    }

    return {
      expenses: {
        recent: recentExpenses.slice(0, 10), // Last 10 transactions
        totalSpent,
        categoryBreakdown,
        monthlyTrend
      },
      budgets: {
        current: currentBudgets,
        performance: budgetPerformance
      },
      portfolios: portfolioData,
      insights: {
        topSpendingCategory,
        averageTransaction,
        budgetHealth,
        spendingTrend
      }
    };
  }

  static async generateRAGPrompt(userMessage: string, context: UserFinancialContext): Promise<string> {
    const budgetInfo = context.budgets.performance.length > 0 
      ? `\nBudget Performance:\n${context.budgets.performance.map(b => 
          `- ${b.category}: ₹${b.spent.toFixed(2)} / ₹${b.budget.toFixed(2)} (${b.percentage.toFixed(0)}%)${b.isOverBudget ? ' - OVER BUDGET' : ''}`
        ).join('\n')}`
      : '\nNo budgets set up yet.';

    const portfolioInfo = context.portfolios 
      ? `\nPortfolio Value: ₹${context.portfolios.totalValue.toFixed(2)}\nHoldings: ${context.portfolios.holdings.map(h => `${h.symbol} (₹${h.totalValue.toFixed(2)})`).join(', ')}`
      : '\nNo portfolio data available.';

    const recentTransactions = context.expenses.recent.length > 0
      ? `\nRecent Transactions:\n${context.expenses.recent.map(e => {
          const date = e.date instanceof Date ? e.date : new Date(e.date);
          return `- ${e.title}: ₹${e.amount} (${e.category}) - ${date.toLocaleDateString()}`;
        }).join('\n')}`
      : '\nNo recent transactions found.';

    return `You are FinanceMate, a personalized AI financial assistant. Use the user's actual financial data below to provide specific, actionable advice.

USER'S FINANCIAL CONTEXT:
- Total Spent (6 months): ₹${context.expenses.totalSpent.toFixed(2)}
- Top Spending Category: ${context.insights.topSpendingCategory} (₹${context.expenses.categoryBreakdown[context.insights.topSpendingCategory]?.toFixed(2) || '0'})
- Average Transaction: ₹${context.insights.averageTransaction.toFixed(2)}
- Budget Health: ${context.insights.budgetHealth.toUpperCase()}
- Spending Trend: ${context.insights.spendingTrend.toUpperCase()}${budgetInfo}${portfolioInfo}${recentTransactions}

CATEGORY BREAKDOWN:
${Object.entries(context.expenses.categoryBreakdown)
  .sort(([,a], [,b]) => b - a)
  .map(([category, amount]) => `- ${category}: ₹${amount.toFixed(2)}`)
  .join('\n')}

USER QUESTION: ${userMessage}

INSTRUCTIONS:
1. Reference specific data from their financial context
2. Provide actionable advice based on their actual spending patterns
3. Highlight any budget issues or opportunities
4. Be specific about amounts and categories
5. Keep responses concise but helpful
6. If they ask about topics not in their financial data, politely redirect to finance topics while being helpful
7. IMPORTANT: Do NOT use Markdown formatting (no **, no #, no lists with *). Use plain text only. Use simple line breaks for structure.

Provide a personalized response based on their actual financial situation:`;
  }

  private static calculateMonthlyTrend(expenses: Expense[]): Array<{ month: string; amount: number }> {
    const monthlyTotals: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const date = expense.date instanceof Date ? expense.date : new Date(expense.date);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(expense.amount);
    });

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));
  }

  private static calculateSpendingTrend(monthlyTrend: Array<{ month: string; amount: number }>): 'increasing' | 'decreasing' | 'stable' {
    if (monthlyTrend.length < 2) return 'stable';
    
    const recent = monthlyTrend.slice(-3); // Last 3 months
    const first = recent[0]?.amount || 0;
    const last = recent[recent.length - 1]?.amount || 0;
    
    const changePercent = ((last - first) / first) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }
}
