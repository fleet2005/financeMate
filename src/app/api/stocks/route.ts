import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStockData } from '@/lib/stockService';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period') || '1mo';

    if (!symbol) {
      return NextResponse.json({ error: 'Stock symbol is required' }, { status: 400 });
    }

    try {
      const stockData = await getStockData(symbol, period);
      return NextResponse.json(stockData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stock data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Stock API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}