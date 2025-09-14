import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initializeDatabase } from '@/lib/database';
import { Expense, ExpenseCategory } from '@/lib/entities/Expense';
import { z } from 'zod';

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  category: z.nativeEnum(ExpenseCategory),
  date: z.string().transform((str) => new Date(str)),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const dataSource = await initializeDatabase();
    const expenseRepository = dataSource.getRepository(Expense);

    let query = expenseRepository
      .createQueryBuilder('expense')
      .where('expense.userId = :userId', { userId });

    if (category && category !== 'all') {
      query = query.andWhere('expense.category = :category', { category });
    }

    if (month && year) {
      query = query.andWhere(
        'EXTRACT(MONTH FROM expense.date) = :month AND EXTRACT(YEAR FROM expense.date) = :year',
        { month: parseInt(month), year: parseInt(year) }
      );
    }

    const expenses = await query
      .orderBy('expense.date', 'DESC')
      .getMany();

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
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
    const validatedData = createExpenseSchema.parse(body);

    const dataSource = await initializeDatabase();
    const expenseRepository = dataSource.getRepository(Expense);

    const expense = expenseRepository.create({
      ...validatedData,
      userId,
    });

    const savedExpense = await expenseRepository.save(expense);
    return NextResponse.json(savedExpense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
