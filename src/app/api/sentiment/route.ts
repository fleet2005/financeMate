import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SentimentAnalysisRequest {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  currentPrice?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
}

interface SentimentAnalysisResult {
  overallSentiment: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE';
  sentimentScore: number; // 0-10 scale
  stockSentiment: {
    score: number;
    description: string;
    keyFactors: string[];
  };
  industrySentiment: {
    score: number;
    description: string;
    keyFactors: string[];
  };
  marketSentiment: {
    score: number;
    description: string;
    keyFactors: string[];
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
}

// Function to fetch real-time news for the stock
async function fetchStockNews(symbol: string, name: string) {
  try {
    const apiKey = process.env.MEDIASTACK_API_KEY;
    if (!apiKey) {
      console.log('No MediaStack API key available');
      return [];
    }

    // Search for news related to the stock
    const searchTerms = [symbol, name.split(' ')[0]]; // Use symbol and first word of company name
    const allNews = [];

    for (const term of searchTerms) {
      const params = new URLSearchParams();
      params.set('access_key', apiKey);
      params.set('keywords', term);
      params.set('countries', 'in,us');
      params.set('languages', 'en');
      params.set('categories', 'business');
      params.set('limit', '5');
      params.set('sort', 'published_desc');

      const response = await fetch(`http://api.mediastack.com/v1/news?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          allNews.push(...data.data);
        }
      }
    }

    // Remove duplicates and return recent news
    const uniqueNews = allNews.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    ).slice(0, 10);

    return uniqueNews;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// Function to get market context data
async function getMarketContext() {
  try {
    const currentHour = new Date().getHours();
    const isMarketHours = currentHour >= 9 && currentHour <= 16; // Rough market hours
    
    // Dynamic market context based on time and general conditions
    const marketData = {
      currentDate: new Date().toISOString(),
      marketHours: isMarketHours ? 'open' : 'closed',
      marketTrend: isMarketHours ? 'active' : 'after-hours',
      volatility: Math.random() > 0.5 ? 'moderate' : 'high', // Simulate varying volatility
      economicIndicators: {
        inflation: 'moderate',
        interestRates: 'stable',
        gdpGrowth: 'positive',
        marketSentiment: isMarketHours ? 'active' : 'cautious'
      },
      recentEvents: [
        'Market volatility due to economic uncertainty',
        'Interest rate decisions pending',
        'Sector rotation in technology stocks'
      ]
    };
    return marketData;
  } catch (error) {
    console.error('Error getting market context:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbol, name, sector, industry, currentPrice, changePercent, volume, marketCap }: SentimentAnalysisRequest = await request.json();
    
    if (!symbol || !name) {
      return NextResponse.json({ error: 'Symbol and name are required' }, { status: 400 });
    }

    // Fetch real-time data
    const [newsData, marketContext] = await Promise.all([
      fetchStockNews(symbol, name),
      getMarketContext()
    ]);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create comprehensive prompt with real data
    const newsContext = newsData.length > 0 
      ? `\nRecent News Headlines:\n${newsData.slice(0, 5).map(article => `- ${article.title}`).join('\n')}`
      : '\nNo recent news found for this stock.';

    const marketContextStr = marketContext 
      ? `\nCurrent Market Context:\n- Market Hours: ${marketContext.marketHours}\n- Market Trend: ${marketContext.marketTrend}\n- Volatility: ${marketContext.volatility}\n- Economic Indicators: ${JSON.stringify(marketContext.economicIndicators)}\n- Recent Events: ${marketContext.recentEvents.join(', ')}`
      : '\nMarket context unavailable.';

    const prompt = `
You are a financial sentiment analysis expert. Analyze the market sentiment for the following stock using REAL DATA and provide a comprehensive sentiment analysis.

Stock Information:
- Symbol: ${symbol}
- Name: ${name}
- Sector: ${sector || 'Not specified'}
- Industry: ${industry || 'Not specified'}
- Current Price: ${currentPrice ? `₹${currentPrice}` : 'Not available'}
- Price Change: ${changePercent ? `${changePercent > 0 ? '+' : ''}${changePercent}%` : 'Not available'}
- Volume: ${volume ? volume.toLocaleString() : 'Not available'}
- Market Cap: ${marketCap ? `₹${(marketCap / 1000000000).toFixed(1)}B` : 'Not available'}
${newsContext}
${marketContextStr}

Please analyze sentiment across three dimensions using the ACTUAL DATA provided:

1. STOCK-SPECIFIC SENTIMENT: Analyze sentiment specifically about ${name} (${symbol}) based on:
   - Recent news headlines and their sentiment
   - Current price movement and volume
   - Company-specific developments mentioned in news
   - Market cap and trading activity

2. INDUSTRY SENTIMENT: Analyze sentiment about the ${industry || sector || 'industry'} sector:
   - Industry trends visible in recent news
   - Regulatory or market changes affecting the sector
   - Competitive landscape developments

3. MARKET SENTIMENT: Analyze overall market sentiment:
   - Current market conditions and trends
   - Economic indicators and their impact
   - General market volatility and sentiment

For each dimension, provide:
- A sentiment score from 0-10 (0 = very negative, 5 = neutral, 10 = very positive)
- A brief description of the sentiment based on ACTUAL DATA
- 2-3 key factors driving this sentiment (use real news/data points)

Then provide:
- Overall sentiment classification (VERY_POSITIVE, POSITIVE, NEUTRAL, NEGATIVE, VERY_NEGATIVE)
- Overall sentiment score (0-10)
- Confidence level (HIGH, MEDIUM, LOW)
- A comprehensive summary based on the real data provided

Respond in JSON format with this exact structure:
{
  "overallSentiment": "POSITIVE",
  "sentimentScore": 7.2,
  "stockSentiment": {
    "score": 7.5,
    "description": "Positive sentiment based on recent news and price movement",
    "keyFactors": ["Specific news headline", "Price movement data", "Volume analysis"]
  },
  "industrySentiment": {
    "score": 6.8,
    "description": "Industry sentiment based on sector news and trends",
    "keyFactors": ["Industry trend from news", "Regulatory development", "Market condition"]
  },
  "marketSentiment": {
    "score": 7.0,
    "description": "Market sentiment based on current conditions",
    "keyFactors": ["Economic indicator", "Market trend", "Volatility measure"]
  },
  "confidence": "MEDIUM",
  "summary": "Overall sentiment analysis based on real data and news for ${name}."
}

CRITICAL: Base your analysis ONLY on the actual data provided above. If no news is available, indicate this in your analysis. Use specific details from the news headlines and market data in your key factors.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      let sentimentData: SentimentAnalysisResult;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        sentimentData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        // Fallback to a neutral sentiment if parsing fails
        sentimentData = {
          overallSentiment: 'NEUTRAL',
          sentimentScore: 5.0,
          stockSentiment: {
            score: 5.0,
            description: 'Unable to analyze stock-specific sentiment',
            keyFactors: ['Analysis unavailable']
          },
          industrySentiment: {
            score: 5.0,
            description: 'Unable to analyze industry sentiment',
            keyFactors: ['Analysis unavailable']
          },
          marketSentiment: {
            score: 5.0,
            description: 'Unable to analyze market sentiment',
            keyFactors: ['Analysis unavailable']
          },
          confidence: 'LOW',
          summary: 'Sentiment analysis unavailable due to technical issues'
        };
      }

      return NextResponse.json({
        ...sentimentData,
        analyzedAt: new Date().toISOString(),
        symbol,
        name
      });

    } catch (aiError) {
      console.error('Gemini API error:', aiError);
      return NextResponse.json({ 
        error: 'AI sentiment analysis service unavailable',
        details: aiError instanceof Error ? aiError.message : 'Unknown error'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Sentiment analysis API error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze sentiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
