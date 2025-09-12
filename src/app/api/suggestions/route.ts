import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeDatabase } from '@/lib/database';
import { Expense } from '@/lib/entities/Expense';

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

    // Calculate spending summary
    const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    // Generate AI suggestions using Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Analyze this user's spending data and provide 3-5 practical savings suggestions:
    
    Total spent this month: $${totalSpent.toFixed(2)}
    Top spending category: ${topCategory[0]} ($${topCategory[1].toFixed(2)})
    Number of transactions: ${expenses.length}
    
    Recent expenses:
    ${expenses.slice(0, 10).map(e => `- ${e.title}: $${e.amount} (${e.category})`).join('\n')}
    
    Please provide specific, actionable suggestions to help save money. Focus on:
    1. Reducing spending in the top category
    2. Identifying potential unnecessary expenses
    3. Practical budgeting tips
    4. Alternative options for expensive items
    
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

    try {
      const suggestions = JSON.parse(text);
      return NextResponse.json({ suggestions });
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      const fallbackSuggestions = [
        {
          type: 'tip',
          title: 'Track your spending',
          message: `You've spent $${totalSpent.toFixed(2)} this month. Consider setting a monthly budget to better control your expenses.`,
          priority: 'medium',
          category: topCategory[0]
        },
        {
          type: 'savings',
          title: 'Reduce top category spending',
          message: `Your biggest expense is ${topCategory[0]} at $${topCategory[1].toFixed(2)}. Look for ways to reduce costs in this area.`,
          priority: 'high',
          category: topCategory[0]
        }
      ];
      return NextResponse.json({ suggestions: fallbackSuggestions });
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
