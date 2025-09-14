import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeDatabase } from '@/lib/database';
import { Expense } from '@/lib/entities/Expense';
import { Budget } from '@/lib/entities/Budget';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Fetch user's expenses
    const dataSource = await initializeDatabase();
    const expenseRepository = dataSource.getRepository(Expense);

    let query = expenseRepository
      .createQueryBuilder('expense')
      .where('expense.userId = :userId', { userId });

    // Only filter by date if month/year are provided
    if (month && year) {
      query = query.andWhere(
        'EXTRACT(MONTH FROM expense.date) = :month AND EXTRACT(YEAR FROM expense.date) = :year',
        { month: parseInt(month), year: parseInt(year) }
      );
    }

    const expenses = await query
      .orderBy('expense.date', 'DESC')
      .getMany();

    // Fetch budgets for current month only
    const budgetRepository = dataSource.getRepository(Budget);
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const budgets = await budgetRepository
      .createQueryBuilder('budget')
      .where('budget.userId = :userId', { userId })
      .andWhere('budget.month = :month', { month: currentMonth })
      .getMany();

    if (expenses.length === 0) {
      return NextResponse.json({
        suggestions: [
          {
            type: 'info',
            title: 'No expenses found',
            message: 'Start tracking your expenses to get personalized savings suggestions!',
            priority: 'low'
          }
        ]
      });
    }

    // If no budgets exist, suggest setting budgets
    if (budgets.length === 0) {
      return NextResponse.json({
        suggestions: [
          {
            type: 'info',
            title: 'Set Monthly Budgets',
            message: 'Consider setting monthly budgets for different categories to better control your expenses and track your spending goals.',
            priority: 'medium'
          }
        ]
      });
    }

    // Calculate spending summary
    const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    // Calculate budget performance
    const budgetPerformance = budgets.map(budget => {
      const spent = categoryTotals[budget.category] || 0;
      const percentage = (spent / Number(budget.amount)) * 100;
      return {
        category: budget.category,
        budget: Number(budget.amount),
        spent,
        percentage,
        isOverBudget: spent > Number(budget.amount)
      };
    });

    // Generate AI suggestions using Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const budgetInfo = budgetPerformance.length > 0 
      ? `\nBudget Performance:\n${budgetPerformance.map(b => 
          `- ${b.category}: ₹${b.spent.toFixed(2)} / ₹${b.budget.toFixed(2)} (${b.percentage.toFixed(0)}%)${b.isOverBudget ? ' - OVER BUDGET' : ''}`
        ).join('\n')}`
      : '';

    const overBudgetCategories = budgetPerformance.filter(b => b.isOverBudget);
    const nearBudgetCategories = budgetPerformance.filter(b => b.percentage >= 80 && !b.isOverBudget);

    const prompt = `
    Analyze this user's spending data and provide 3-5 practical savings suggestions:
    
    Total spent this month: ₹${totalSpent.toFixed(2)}
    Top spending category: ${topCategory[0]} (₹${topCategory[1].toFixed(2)})
    Number of transactions: ${expenses.length}${budgetInfo}
    
    Recent expenses:
    ${expenses.slice(0, 10).map(e => `- ${e.title}: ₹${e.amount} (${e.category})`).join('\n')}
    
    IMPORTANT: The user already has budgets set up. Do NOT suggest setting budgets. Instead, focus on:
    1. Over-budget categories: ${overBudgetCategories.map(b => b.category).join(', ') || 'None'}
    2. Categories near budget limit: ${nearBudgetCategories.map(b => b.category).join(', ') || 'None'}
    3. Reducing spending in the top category
    4. Identifying potential unnecessary expenses
    5. Practical money-saving tips for specific categories
    6. Alternative options for expensive items
    
    Format your response as a JSON array with objects containing:
    - type: "savings" | "warning" | "tip" | "info"
    - title: short descriptive title
    - message: detailed suggestion
    - priority: "high" | "medium" | "low"
    - category: the expense category this relates to (if applicable)
    
    Keep suggestions practical and encouraging. Return only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('AI Response:', text);
    console.log('Budget Performance:', budgetPerformance);

    try {
      // Clean the response by removing markdown code fences
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const suggestions = JSON.parse(cleanText);
      return NextResponse.json({ suggestions });
    } catch (parseError) {
      console.log('AI JSON parse error, using fallback suggestions');
      console.log('Parse error:', parseError);
      console.log('Cleaned text:', text);
      // Fallback if AI doesn't return valid JSON
      const overBudgetCategories = budgetPerformance.filter(b => b.isOverBudget);
      const nearBudgetCategories = budgetPerformance.filter(b => b.percentage >= 80 && !b.isOverBudget);
      
      const fallbackSuggestions = [];
      
      // Add over-budget warnings
      overBudgetCategories.forEach(budget => {
        fallbackSuggestions.push({
          type: 'warning',
          title: `${budget.category} over budget`,
          message: `You've exceeded your ${budget.category} budget by ₹${(budget.spent - budget.budget).toFixed(2)}. Consider reducing spending in this category.`,
          priority: 'high',
          category: budget.category
        });
      });
      
      // Add near-budget warnings
      nearBudgetCategories.forEach(budget => {
        fallbackSuggestions.push({
          type: 'tip',
          title: `${budget.category} near budget limit`,
          message: `Your ${budget.category} spending is at ${budget.percentage.toFixed(0)}% of budget. You have ₹${(budget.budget - budget.spent).toFixed(2)} remaining.`,
          priority: 'medium',
          category: budget.category
        });
      });
      
      // Add general spending tip if no specific budget issues
      if (fallbackSuggestions.length === 0) {
        fallbackSuggestions.push({
          type: 'savings',
          title: 'Reduce top category spending',
          message: `Your biggest expense is ${topCategory[0]} at ₹${topCategory[1].toFixed(2)}. Look for ways to reduce costs in this area.`,
          priority: 'medium',
          category: topCategory[0]
        });
      }
      
      return NextResponse.json({ suggestions: fallbackSuggestions });
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
