import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initializeDatabase } from '@/lib/database';
import { Portfolio } from '@/lib/entities/Portfolio';
import { getCurrentStockPrice } from '@/lib/stockService';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataSource = await initializeDatabase();
    const portfolioRepository = dataSource.getRepository(Portfolio);
    
    const portfolios = await portfolioRepository.find({
      where: { userId }
    });

    if (portfolios.length === 0) {
      return NextResponse.json({ message: 'No portfolios to update' });
    }

    // Update each portfolio with current prices
    const updatedPortfolios = [];
    for (const portfolio of portfolios) {
      try {
        // Fetch current price directly from stock service
        console.log(`Updating price for ${portfolio.symbol}`);
        const currentPrice = await getCurrentStockPrice(portfolio.symbol);
        
        if (currentPrice !== null && !Number.isNaN(currentPrice)) {
          console.log(`Got price ${currentPrice} for ${portfolio.symbol}`);
          
          portfolio.currentPrice = Number(currentPrice);
          portfolio.totalValue = Number(portfolio.quantity) * Number(currentPrice);
          
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
          
          // Ensure no NaN values are saved
          if (!Number.isNaN(Number(portfolio.totalValue)) && !Number.isNaN(Number(portfolio.totalGainLoss)) && !Number.isNaN(Number(portfolio.gainLossPercentage))) {
            const updatedPortfolio = await portfolioRepository.save(portfolio);
            updatedPortfolios.push(updatedPortfolio);
            console.log(`Successfully updated ${portfolio.symbol} with price ${currentPrice}`);
          } else {
            console.log(`Invalid calculations for ${portfolio.symbol}, skipping update`);
          }
        } else {
          console.log(`No valid current price found for ${portfolio.symbol}`);
        }
      } catch (error) {
        console.error(`Error updating price for ${portfolio.symbol}:`, error);
        // Continue with other portfolios even if one fails
      }
    }

    return NextResponse.json({ 
      message: `Updated ${updatedPortfolios.length} portfolios`,
      portfolios: updatedPortfolios 
    });
  } catch (error) {
    console.error('Error updating portfolio prices:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio prices' },
      { status: 500 }
    );
  }
}
