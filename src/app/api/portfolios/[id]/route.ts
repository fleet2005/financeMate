import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initializeDatabase } from '@/lib/database';
import { Portfolio } from '@/lib/entities/Portfolio';
import { z } from 'zod';

const updatePortfolioSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').optional(),
  companyName: z.string().min(1, 'Company name is required').optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  averagePrice: z.number().positive('Average price must be positive').optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const dataSource = await initializeDatabase();
    const portfolioRepository = dataSource.getRepository(Portfolio);
    
    const portfolio = await portfolioRepository.findOne({
      where: { id, userId }
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePortfolioSchema.parse(body);

    const dataSource = await initializeDatabase();
    const portfolioRepository = dataSource.getRepository(Portfolio);
    
    const portfolio = await portfolioRepository.findOne({
      where: { id, userId }
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Update portfolio fields
    Object.assign(portfolio, validatedData);
    
    // Recalculate totalValue, totalGainLoss, and gainLossPercentage if quantity or averagePrice changed
    // and currentPrice exists
    if ((validatedData.quantity !== undefined || validatedData.averagePrice !== undefined) && 
        portfolio.currentPrice !== null && portfolio.currentPrice !== undefined) {
      portfolio.totalValue = Number(portfolio.quantity) * Number(portfolio.currentPrice);
      
      const totalCost = Number(portfolio.quantity) * Number(portfolio.averagePrice);
      portfolio.totalGainLoss = Number(portfolio.totalValue) - totalCost;
      
      // Only calculate percentage if totalCost is not zero to avoid division by zero
      // Cap percentage at 999.99 to fit within decimal(5,2) precision limit
      if (totalCost > 0) {
        const calculatedPercentage = (Number(portfolio.totalGainLoss) / totalCost) * 100;
        portfolio.gainLossPercentage = Math.max(-999.99, Math.min(999.99, calculatedPercentage));
      } else {
        portfolio.gainLossPercentage = 0;
      }
    }
    
    const updatedPortfolio = await portfolioRepository.save(portfolio);

    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const dataSource = await initializeDatabase();
    const portfolioRepository = dataSource.getRepository(Portfolio);
    
    const portfolio = await portfolioRepository.findOne({
      where: { id, userId }
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    await portfolioRepository.remove(portfolio);
    return NextResponse.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to delete portfolio' },
      { status: 500 }
    );
  }
}
