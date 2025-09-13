import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initializeDatabase } from '@/lib/database';
import { Portfolio } from '@/lib/entities/Portfolio';
import { z } from 'zod';

const createPortfolioSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  companyName: z.string().min(1, 'Company name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  averagePrice: z.number().positive('Average price must be positive'),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataSource = await initializeDatabase();
    const portfolioRepository = dataSource.getRepository(Portfolio);
    
    const portfolios = await portfolioRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    return NextResponse.json(portfolios);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPortfolioSchema.parse(body);

    const dataSource = await initializeDatabase();
    const portfolioRepository = dataSource.getRepository(Portfolio);

    // Check if portfolio already exists for this symbol
    const existingPortfolio = await portfolioRepository.findOne({
      where: { userId, symbol: validatedData.symbol }
    });

    if (existingPortfolio) {
      // Update existing portfolio by adding quantities and recalculating average price
      const totalQuantity = existingPortfolio.quantity + validatedData.quantity;
      const totalCost = (existingPortfolio.quantity * Number(existingPortfolio.averagePrice)) + 
                       (validatedData.quantity * validatedData.averagePrice);
      const newAveragePrice = totalCost / totalQuantity;

      existingPortfolio.quantity = totalQuantity;
      existingPortfolio.averagePrice = newAveragePrice;
      if (validatedData.notes) {
        existingPortfolio.notes = validatedData.notes;
      }

      const updatedPortfolio = await portfolioRepository.save(existingPortfolio);
      return NextResponse.json(updatedPortfolio, { status: 200 });
    }

    // Create new portfolio entry
    const portfolio = portfolioRepository.create({
      userId,
      symbol: validatedData.symbol,
      companyName: validatedData.companyName,
      quantity: validatedData.quantity,
      averagePrice: validatedData.averagePrice,
      notes: validatedData.notes,
    });

    const savedPortfolio = await portfolioRepository.save(portfolio);
    return NextResponse.json(savedPortfolio, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 }
    );
  }
}
