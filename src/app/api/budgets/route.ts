import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initializeDatabase } from '@/lib/database';
import { Budget } from '@/lib/entities/Budget';
import { Expense, ExpenseCategory } from '@/lib/entities/Expense';
import { z } from 'zod';

const createBudgetSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive('Amount must be positive'),
  month: z.string().transform((str) => new Date(str)),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const dataSource = await initializeDatabase();
    const budgetRepository = dataSource.getRepository(Budget);

    let query = budgetRepository
      .createQueryBuilder('budget')
      .where('budget.userId = :userId', { userId });

    if (month && year) {
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      query = query.andWhere('budget.month = :month', { month: targetDate });
    }

    const budgets = await query.orderBy('budget.category', 'ASC').getMany();

    // Calculate spending for each budget
    const expenseRepository = dataSource.getRepository(Expense);
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(budget.month);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

        const expenses = await expenseRepository
          .createQueryBuilder('expense')
          .where('expense.userId = :userId', { userId })
          .andWhere('expense.category = :category', { category: budget.category })
          .andWhere('expense.date >= :startDate', { startDate })
          .andWhere('expense.date <= :endDate', { endDate })
          .getMany();

        const spent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
        const remaining = Number(budget.amount) - spent;
        const percentage = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;

        return {
          ...budget,
          spent,
          remaining,
          percentage: Math.min(percentage, 100),
          isOverBudget: spent > Number(budget.amount),
        };
      })
    );

    return NextResponse.json(budgetsWithSpending);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBudgetSchema.parse(body);

    // Validate that budget is for current month only
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    
    const budgetDate = new Date(validatedData.month);
    const budgetYear = budgetDate.getFullYear();
    const budgetMonth = budgetDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    
    if (budgetYear !== currentYear || budgetMonth !== currentMonth) {
      return NextResponse.json(
        { error: 'Budgets can only be set for the current month' },
        { status: 400 }
      );
    }

    const dataSource = await initializeDatabase();
    const budgetRepository = dataSource.getRepository(Budget);

    // Check if budget already exists for this category and month
    const existingBudget = await budgetRepository.findOne({
      where: {
        userId,
        category: validatedData.category,
        month: validatedData.month,
      },
    });

    if (existingBudget) {
      // Update existing budget by adding the new amount
      const newAmount = Number(existingBudget.amount) + Number(validatedData.amount);
      existingBudget.amount = newAmount;
      
      // Update description if provided
      if (validatedData.description) {
        existingBudget.description = validatedData.description;
      }
      
      const updatedBudget = await budgetRepository.save(existingBudget);
      return NextResponse.json(updatedBudget, { status: 200 });
    }

    const budget = budgetRepository.create({
      ...validatedData,
      userId,
    });

    const savedBudget = await budgetRepository.save(budget);
    return NextResponse.json(savedBudget, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating budget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
