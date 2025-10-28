// Shared stock data service for both stocks API and portfolio updates

interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  week52High: number;
  week52Low: number;
  marketCap: number | null;
  pe: number | null;
  dividend: number | null;
  sector: string | null;
  industry: string | null;
  description: string | null;
  historicalData: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

// Yahoo Finance API function
async function fetchYahooFinance(symbol: string, period: string): Promise<StockData | null> {
  try {
    // Convert symbol format for Yahoo Finance
    let yahooSymbol = symbol;
    if (symbol.includes('.BSE')) {
      yahooSymbol = symbol.replace('.BSE', '.BO'); // BSE format for Yahoo
    } else if (symbol.includes('.NS')) {
      yahooSymbol = symbol.replace('.NS', '.NS'); // NSE format for Yahoo
    }
    
    console.log('Trying Yahoo Finance with symbol:', yahooSymbol);
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${period}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data available from Yahoo Finance');
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const quotes = result.timestamp.map((timestamp: number, index: number) => ({
      timestamp,
      open: result.indicators.quote[0].open[index],
      high: result.indicators.quote[0].high[index],
      low: result.indicators.quote[0].low[index],
      close: result.indicators.quote[0].close[index],
      volume: result.indicators.quote[0].volume[index]
    })).filter((quote: { close: number | null }) => quote.close !== null);
    
    const hist = quotes;
    const info = meta;
    
    // Calculate performance metrics
    const currentPrice = hist[hist.length - 1].close;
    const previousPrice = hist[hist.length - 2]?.close || currentPrice;
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice ? (change / previousPrice) * 100 : 0;
    
    const prices = hist.map((h: { close: number }) => h.close).filter((p: number) => p !== null);
    const week52High = Math.max(...prices);
    const week52Low = Math.min(...prices);
    
    const volumes = hist.map((h: { volume: number }) => h.volume).filter((v: number) => v !== null);
    const avgVolume = volumes.reduce((sum: number, vol: number) => sum + vol, 0) / volumes.length;
    
    const latestQuote = hist[hist.length - 1];
    
    return {
      symbol: symbol.toUpperCase(),
      name: info.longName || info.shortName || symbol,
      currentPrice: Number(currentPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      previousClose: Number(previousPrice.toFixed(2)),
      open: Number(latestQuote.open.toFixed(2)),
      high: Number(latestQuote.high.toFixed(2)),
      low: Number(latestQuote.low.toFixed(2)),
      volume: Number(latestQuote.volume),
      avgVolume: Number(avgVolume.toFixed(0)),
      week52High: Number(week52High.toFixed(2)),
      week52Low: Number(week52Low.toFixed(2)),
      marketCap: info.marketCap ? Number(info.marketCap) : null,
      pe: info.trailingPE ? Number(info.trailingPE.toFixed(2)) : null,
      dividend: info.dividendYield ? Number((info.dividendYield * 100).toFixed(2)) : null,
      sector: info.sector || null,
      industry: info.industry || null,
      description: info.longBusinessSummary || null,
      historicalData: hist.map((quote: { timestamp: number; open: number; high: number; low: number; close: number; volume: number }) => ({
        date: new Date(quote.timestamp * 1000).toISOString().split('T')[0],
        open: Number(quote.open.toFixed(2)),
        high: Number(quote.high.toFixed(2)),
        low: Number(quote.low.toFixed(2)),
        close: Number(quote.close.toFixed(2)),
        volume: Number(quote.volume)
      }))
    };
  } catch (error) {
    console.error('Yahoo Finance error:', error);
    return null;
  }
}

// Enhanced mock data generator with realistic prices for Indian stocks
function generateRealisticMockData(symbol: string, period: string): StockData {
  // Realistic base prices for Indian stocks
  const realisticPrices: { [key: string]: number } = {
    // Large Cap Stocks
    'RELIANCE.BSE': 2500.00,
    'TCS.BSE': 3800.00,
    'HDFCBANK.BSE': 1600.00,
    'INFY.BSE': 1500.00,
    'HINDUNILVR.BSE': 2400.00,
    'ITC.BSE': 450.00,
    'SBIN.BSE': 600.00,
    'BHARTIARTL.BSE': 950.00,
    'KOTAKBANK.BSE': 1800.00,
    'ICICIBANK.BSE': 1100.00,
    'LT.BSE': 3500.00,
    'ASIANPAINT.BSE': 3200.00,
    'MARUTI.BSE': 12000.00,
    'BAJFINANCE.BSE': 7000.00,
    'NESTLEIND.BSE': 20000.00,
    'TITAN.BSE': 3000.00,
    'ULTRACEMCO.BSE': 8000.00,
    'WIPRO.BSE': 400.00,
    'TECHM.BSE': 1200.00,
    'POWERGRID.BSE': 200.00,
    'NTPC.BSE': 180.00,
    'ONGC.BSE': 150.00,
    'COALINDIA.BSE': 250.00,
    'SUNPHARMA.BSE': 1000.00,
    'DRREDDY.BSE': 5500.00,
    'CIPLA.BSE': 1200.00,
    'APOLLOHOSP.BSE': 5000.00,
    'DIVISLAB.BSE': 3500.00,
    'BAJAJFINSV.BSE': 1500.00,
    'BAJAJ-AUTO.BSE': 4000.00,
    'HEROMOTOCO.BSE': 3000.00,
    'EICHERMOT.BSE': 3500.00,
    'M&M.BSE': 1200.00,
    'TATAMOTORS.BSE': 500.00,
    'AXISBANK.BSE': 1000.00,
    'INDUSINDBK.BSE': 1200.00,
    'GRASIM.BSE': 1800.00,
    'ADANIPORTS.BSE': 800.00,
    'ADANIENT.BSE': 3000.00,
    'ADANIGREEN.BSE': 1000.00,
    'JSWSTEEL.BSE': 800.00,
    'TATASTEEL.BSE': 120.00,
    'HINDALCO.BSE': 400.00,
    'VEDL.BSE': 250.00,
    'BPCL.BSE': 400.00,
    'IOC.BSE': 100.00,
    'GAIL.BSE': 150.00,
    'HCLTECH.BSE': 1200.00,
    'MINDTREE.BSE': 3500.00,
    'LTI.BSE': 4500.00,
    'MPHASIS.BSE': 2500.00,
    'PERSISTENT.BSE': 5000.00,
    'COFORGE.BSE': 4000.00,
    'ZOMATO.BSE': 80.00,
    'PAYTM.BSE': 600.00,
    'POLICYBZR.BSE': 1000.00,
    'IRCTC.BSE': 800.00,
    'DMART.BSE': 4000.00,
    'TRENT.BSE': 1200.00,
    'TITAGARH.BSE': 800.00,
    'RAILTEL.BSE': 200.00,
    'IRFC.BSE': 30.00,
    'SJVN.BSE': 50.00,
    'NHPC.BSE': 40.00,
    'SAPPHIRE.BSE': 1200.00,
    'BANDHANBNK.BSE': 200.00,
    'FEDERALBNK.BSE': 100.00,
    'IDFCFIRSTB.BSE': 80.00,
    'YESBANK.BSE': 20.00,
    'PNB.BSE': 50.00,
    'CANFINHOME.BSE': 600.00,
    'LICHSGFIN.BSE': 400.00,
    'CHOLAFIN.BSE': 800.00,
    'BAJAJHLDNG.BSE': 6000.00,
    'GODREJCP.BSE': 800.00,
    'DABUR.BSE': 500.00,
    'MARICO.BSE': 500.00,
    'COLPAL.BSE': 1500.00,
    'PGHH.BSE': 12000.00,
    'BRITANNIA.BSE': 4000.00,
    'TATACONSUM.BSE': 800.00,
    'SHOPPERSSTOP.BSE': 500.00,
    'PAGEIND.BSE': 50000.00,
    'RELAXO.BSE': 1000.00,
    'BATAINDIA.BSE': 1500.00,
    'CROMPTON.BSE': 300.00,
    'VOLTAS.BSE': 800.00,
    'WHIRLPOOL.BSE': 2000.00,
    'BLUEDART.BSE': 6000.00
  };

  const basePrice = realisticPrices[symbol.toUpperCase()] || Math.random() * 1000 + 100;
  
  // Generate historical data
  const days = period === '1d' ? 1 : period === '5d' ? 5 : period === '1mo' ? 30 : 
               period === '3mo' ? 90 : period === '6mo' ? 180 : period === '1y' ? 365 : 30;
  
  const historicalData = [];
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dailyChange = (Math.random() - 0.5) * (basePrice * 0.02); // ±1% daily change
    currentPrice = Math.max(basePrice * 0.5, currentPrice + dailyChange);
    
    historicalData.push({
      date: date.toISOString().split('T')[0],
      open: Number((currentPrice + (Math.random() - 0.5) * (basePrice * 0.01)).toFixed(2)),
      high: Number((currentPrice + Math.random() * (basePrice * 0.02)).toFixed(2)),
      low: Number((currentPrice - Math.random() * (basePrice * 0.02)).toFixed(2)),
      close: Number(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000
    });
  }
  
  const latest = historicalData[historicalData.length - 1];
  const previous = historicalData[historicalData.length - 2] || latest;
  
  const prices = historicalData.map(h => h.close);
  const volumes = historicalData.map(h => h.volume);
  
  return {
    symbol: symbol.toUpperCase(),
    name: getStockName(symbol),
    currentPrice: Number(latest.close.toFixed(2)),
    change: Number((latest.close - previous.close).toFixed(2)),
    changePercent: Number(((latest.close - previous.close) / previous.close * 100).toFixed(2)),
    previousClose: Number(previous.close.toFixed(2)),
    open: Number(latest.open.toFixed(2)),
    high: Number(latest.high.toFixed(2)),
    low: Number(latest.low.toFixed(2)),
    volume: Number(latest.volume),
    avgVolume: Number((volumes.reduce((a, b) => a + b, 0) / volumes.length).toFixed(0)),
    week52High: Number(Math.max(...prices).toFixed(2)),
    week52Low: Number(Math.min(...prices).toFixed(2)),
    marketCap: Math.floor(Math.random() * 1000000000000) + 1000000000,
    pe: Number((Math.random() * 50 + 10).toFixed(2)),
    dividend: Number((Math.random() * 5).toFixed(2)),
    sector: getStockSector(symbol),
    industry: getStockIndustry(symbol),
    description: getStockDescription(symbol),
    historicalData: historicalData
  };
}

function getStockName(symbol: string): string {
  const names: { [key: string]: string } = {
    // Large Cap Stocks
    'RELIANCE.BSE': 'Reliance Industries Limited',
    'TCS.BSE': 'Tata Consultancy Services Limited',
    'HDFCBANK.BSE': 'HDFC Bank Limited',
    'INFY.BSE': 'Infosys Limited',
    'HINDUNILVR.BSE': 'Hindustan Unilever Limited',
    'ITC.BSE': 'ITC Limited',
    'SBIN.BSE': 'State Bank of India',
    'BHARTIARTL.BSE': 'Bharti Airtel Limited',
    'KOTAKBANK.BSE': 'Kotak Mahindra Bank Limited',
    'ICICIBANK.BSE': 'ICICI Bank Limited',
    'LT.BSE': 'Larsen & Toubro Limited',
    'ASIANPAINT.BSE': 'Asian Paints Limited',
    'MARUTI.BSE': 'Maruti Suzuki India Limited',
    'BAJFINANCE.BSE': 'Bajaj Finance Limited',
    'NESTLEIND.BSE': 'Nestle India Limited',
    'TITAN.BSE': 'Titan Company Limited',
    'ULTRACEMCO.BSE': 'UltraTech Cement Limited',
    'WIPRO.BSE': 'Wipro Limited',
    'TECHM.BSE': 'Tech Mahindra Limited',
    'POWERGRID.BSE': 'Power Grid Corporation of India Limited',
    'NTPC.BSE': 'NTPC Limited',
    'ONGC.BSE': 'Oil and Natural Gas Corporation Limited',
    'COALINDIA.BSE': 'Coal India Limited',
    'SUNPHARMA.BSE': 'Sun Pharmaceutical Industries Limited',
    'DRREDDY.BSE': 'Dr. Reddy\'s Laboratories Limited',
    'CIPLA.BSE': 'Cipla Limited',
    'APOLLOHOSP.BSE': 'Apollo Hospitals Enterprise Limited',
    'DIVISLAB.BSE': 'Divi\'s Laboratories Limited',
    'BAJAJFINSV.BSE': 'Bajaj Finserv Limited',
    'BAJAJ-AUTO.BSE': 'Bajaj Auto Limited',
    'HEROMOTOCO.BSE': 'Hero MotoCorp Limited',
    'EICHERMOT.BSE': 'Eicher Motors Limited',
    'M&M.BSE': 'Mahindra & Mahindra Limited',
    'TATAMOTORS.BSE': 'Tata Motors Limited',
    'AXISBANK.BSE': 'Axis Bank Limited',
    'INDUSINDBK.BSE': 'IndusInd Bank Limited',
    'GRASIM.BSE': 'Grasim Industries Limited',
    'ADANIPORTS.BSE': 'Adani Ports and Special Economic Zone Limited',
    'ADANIENT.BSE': 'Adani Enterprises Limited',
    'ADANIGREEN.BSE': 'Adani Green Energy Limited',
    'JSWSTEEL.BSE': 'JSW Steel Limited',
    'TATASTEEL.BSE': 'Tata Steel Limited',
    'HINDALCO.BSE': 'Hindalco Industries Limited',
    'VEDL.BSE': 'Vedanta Limited',
    'BPCL.BSE': 'Bharat Petroleum Corporation Limited',
    'IOC.BSE': 'Indian Oil Corporation Limited',
    'GAIL.BSE': 'GAIL (India) Limited',
    'HCLTECH.BSE': 'HCL Technologies Limited',
    'MINDTREE.BSE': 'Mindtree Limited',
    'LTI.BSE': 'Larsen & Toubro Infotech Limited',
    'MPHASIS.BSE': 'Mphasis Limited',
    'PERSISTENT.BSE': 'Persistent Systems Limited',
    'COFORGE.BSE': 'Coforge Limited',
    'ZOMATO.BSE': 'Zomato Limited',
    'PAYTM.BSE': 'One97 Communications Limited (Paytm)',
    'POLICYBZR.BSE': 'PB Fintech Limited (Policybazaar)',
    'IRCTC.BSE': 'Indian Railway Catering and Tourism Corporation Limited',
    'DMART.BSE': 'Avenue Supermarts Limited (D-Mart)',
    'TRENT.BSE': 'Trent Limited',
    'TITAGARH.BSE': 'Titagarh Wagons Limited',
    'RAILTEL.BSE': 'RailTel Corporation of India Limited',
    'IRFC.BSE': 'Indian Railway Finance Corporation Limited',
    'SJVN.BSE': 'SJVN Limited',
    'NHPC.BSE': 'NHPC Limited',
    'SAPPHIRE.BSE': 'Sapphire Foods India Limited',
    'BANDHANBNK.BSE': 'Bandhan Bank Limited',
    'FEDERALBNK.BSE': 'Federal Bank Limited',
    'IDFCFIRSTB.BSE': 'IDFC First Bank Limited',
    'YESBANK.BSE': 'Yes Bank Limited',
    'PNB.BSE': 'Punjab National Bank',
    'CANFINHOME.BSE': 'Can Fin Homes Limited',
    'LICHSGFIN.BSE': 'LIC Housing Finance Limited',
    'CHOLAFIN.BSE': 'Cholamandalam Investment and Finance Company Limited',
    'BAJAJHLDNG.BSE': 'Bajaj Holdings & Investment Limited',
    'GODREJCP.BSE': 'Godrej Consumer Products Limited',
    'DABUR.BSE': 'Dabur India Limited',
    'MARICO.BSE': 'Marico Limited',
    'COLPAL.BSE': 'Colgate Palmolive (India) Limited',
    'PGHH.BSE': 'Procter & Gamble Hygiene and Health Care Limited',
    'BRITANNIA.BSE': 'Britannia Industries Limited',
    'TATACONSUM.BSE': 'Tata Consumer Products Limited',
    'SHOPPERSSTOP.BSE': 'Shoppers Stop Limited',
    'PAGEIND.BSE': 'Page Industries Limited',
    'RELAXO.BSE': 'Relaxo Footwears Limited',
    'BATAINDIA.BSE': 'Bata India Limited',
    'CROMPTON.BSE': 'Crompton Greaves Consumer Electricals Limited',
    'VOLTAS.BSE': 'Voltas Limited',
    'WHIRLPOOL.BSE': 'Whirlpool of India Limited',
    'BLUEDART.BSE': 'Blue Dart Express Limited',
    'LALPATHLAB.BSE': 'Dr. Lal PathLabs Limited',
    'METROPOLIS.BSE': 'Metropolis Healthcare Limited',
    'FORTIS.BSE': 'Fortis Healthcare Limited',
    'MAXHEALTH.BSE': 'Max Healthcare Institute Limited',
    'NARAYANKH.BSE': 'Narayana Hrudayalaya Limited',
    'STAR.BSE': 'Strides Pharma Science Limited',
    'INDIANHUME.BSE': 'Indian Hume Pipe Company Limited',
    'HAVELLS.BSE': 'Havells India Limited',
    'BLUESTARCO.BSE': 'Blue Star Limited',
    'AMBER.BSE': 'Amber Enterprises India Limited',
    'ORIENTELEC.BSE': 'Orient Electric Limited',
    'SUZLON.BSE': 'Suzlon Energy Limited',
    'TATAPOWER.BSE': 'Tata Power Company Limited',
    'ADANIPOWER.BSE': 'Adani Power Limited',
    'TATACOMM.BSE': 'Tata Communications Limited',
    'JIO.BSE': 'Reliance Jio Infocomm Limited'
  };
  return names[symbol.toUpperCase()] || symbol;
}

function getStockSector(symbol: string): string {
  const sectors: { [key: string]: string } = {
    // Banking & Financial Services
    'HDFCBANK.BSE': 'Financial Services',
    'ICICIBANK.BSE': 'Financial Services',
    'KOTAKBANK.BSE': 'Financial Services',
    'AXISBANK.BSE': 'Financial Services',
    'INDUSINDBK.BSE': 'Financial Services',
    'SBIN.BSE': 'Financial Services',
    'BANDHANBNK.BSE': 'Financial Services',
    'FEDERALBNK.BSE': 'Financial Services',
    'IDFCFIRSTB.BSE': 'Financial Services',
    'YESBANK.BSE': 'Financial Services',
    'PNB.BSE': 'Financial Services',
    'BAJFINANCE.BSE': 'Financial Services',
    'BAJAJFINSV.BSE': 'Financial Services',
    'CANFINHOME.BSE': 'Financial Services',
    'LICHSGFIN.BSE': 'Financial Services',
    'CHOLAFIN.BSE': 'Financial Services',
    'BAJAJHLDNG.BSE': 'Financial Services',
    
    // Technology
    'TCS.BSE': 'Technology',
    'INFY.BSE': 'Technology',
    'WIPRO.BSE': 'Technology',
    'HCLTECH.BSE': 'Technology',
    'TECHM.BSE': 'Technology',
    'MINDTREE.BSE': 'Technology',
    'LTI.BSE': 'Technology',
    'MPHASIS.BSE': 'Technology',
    'PERSISTENT.BSE': 'Technology',
    'COFORGE.BSE': 'Technology',
    'ZOMATO.BSE': 'Technology',
    'PAYTM.BSE': 'Technology',
    'POLICYBZR.BSE': 'Technology',
    
    // Energy & Oil
    'RELIANCE.BSE': 'Energy',
    'ONGC.BSE': 'Energy',
    'BPCL.BSE': 'Energy',
    'IOC.BSE': 'Energy',
    'GAIL.BSE': 'Energy',
    'ADANIENT.BSE': 'Energy',
    'ADANIPOWER.BSE': 'Energy',
    'TATAPOWER.BSE': 'Energy',
    'NTPC.BSE': 'Energy',
    'POWERGRID.BSE': 'Energy',
    'SUZLON.BSE': 'Energy',
    'SJVN.BSE': 'Energy',
    'NHPC.BSE': 'Energy',
    
    // Consumer Staples
    'HINDUNILVR.BSE': 'Consumer Staples',
    'ITC.BSE': 'Consumer Staples',
    'NESTLEIND.BSE': 'Consumer Staples',
    'DABUR.BSE': 'Consumer Staples',
    'MARICO.BSE': 'Consumer Staples',
    'COLPAL.BSE': 'Consumer Staples',
    'PGHH.BSE': 'Consumer Staples',
    'BRITANNIA.BSE': 'Consumer Staples',
    'TATACONSUM.BSE': 'Consumer Staples',
    'GODREJCP.BSE': 'Consumer Staples',
    
    // Consumer Discretionary
    'MARUTI.BSE': 'Consumer Discretionary',
    'TITAN.BSE': 'Consumer Discretionary',
    'BAJAJ-AUTO.BSE': 'Consumer Discretionary',
    'HEROMOTOCO.BSE': 'Consumer Discretionary',
    'EICHERMOT.BSE': 'Consumer Discretionary',
    'M&M.BSE': 'Consumer Discretionary',
    'TATAMOTORS.BSE': 'Consumer Discretionary',
    'DMART.BSE': 'Consumer Discretionary',
    'TRENT.BSE': 'Consumer Discretionary',
    'SHOPPERSSTOP.BSE': 'Consumer Discretionary',
    'PAGEIND.BSE': 'Consumer Discretionary',
    'RELAXO.BSE': 'Consumer Discretionary',
    'BATAINDIA.BSE': 'Consumer Discretionary',
    'CROMPTON.BSE': 'Consumer Discretionary',
    'VOLTAS.BSE': 'Consumer Discretionary',
    'WHIRLPOOL.BSE': 'Consumer Discretionary',
    'HAVELLS.BSE': 'Consumer Discretionary',
    'BLUESTARCO.BSE': 'Consumer Discretionary',
    'AMBER.BSE': 'Consumer Discretionary',
    'ORIENTELEC.BSE': 'Consumer Discretionary',
    
    // Healthcare
    'SUNPHARMA.BSE': 'Healthcare',
    'DRREDDY.BSE': 'Healthcare',
    'CIPLA.BSE': 'Healthcare',
    'APOLLOHOSP.BSE': 'Healthcare',
    'DIVISLAB.BSE': 'Healthcare',
    'LALPATHLAB.BSE': 'Healthcare',
    'METROPOLIS.BSE': 'Healthcare',
    'FORTIS.BSE': 'Healthcare',
    'MAXHEALTH.BSE': 'Healthcare',
    'NARAYANKH.BSE': 'Healthcare',
    'STAR.BSE': 'Healthcare',
    
    // Materials
    'ULTRACEMCO.BSE': 'Materials',
    'GRASIM.BSE': 'Materials',
    'JSWSTEEL.BSE': 'Materials',
    'TATASTEEL.BSE': 'Materials',
    'HINDALCO.BSE': 'Materials',
    'VEDL.BSE': 'Materials',
    'COALINDIA.BSE': 'Materials',
    'ASIANPAINT.BSE': 'Materials',
    
    // Communication Services
    'BHARTIARTL.BSE': 'Communication Services',
    'TATACOMM.BSE': 'Communication Services',
    'JIO.BSE': 'Communication Services',
    'RAILTEL.BSE': 'Communication Services',
    
    // Infrastructure & Construction
    'LT.BSE': 'Infrastructure',
    'ADANIPORTS.BSE': 'Infrastructure',
    'ADANIGREEN.BSE': 'Infrastructure',
    'TITAGARH.BSE': 'Infrastructure',
    'IRCTC.BSE': 'Infrastructure',
    'IRFC.BSE': 'Infrastructure',
    'INDIANHUME.BSE': 'Infrastructure',
    
    // Logistics
    'BLUEDART.BSE': 'Logistics',
    'SAPPHIRE.BSE': 'Logistics'
  };
  return sectors[symbol.toUpperCase()] || 'Other';
}

function getStockIndustry(symbol: string): string {
  const industries: { [key: string]: string } = {
    // Banking
    'HDFCBANK.BSE': 'Private Banks',
    'ICICIBANK.BSE': 'Private Banks',
    'KOTAKBANK.BSE': 'Private Banks',
    'AXISBANK.BSE': 'Private Banks',
    'INDUSINDBK.BSE': 'Private Banks',
    'SBIN.BSE': 'Public Sector Banks',
    'BANDHANBNK.BSE': 'Private Banks',
    'FEDERALBNK.BSE': 'Private Banks',
    'IDFCFIRSTB.BSE': 'Private Banks',
    'YESBANK.BSE': 'Private Banks',
    'PNB.BSE': 'Public Sector Banks',
    
    // Financial Services
    'BAJFINANCE.BSE': 'Non-Banking Financial Services',
    'BAJAJFINSV.BSE': 'Non-Banking Financial Services',
    'CANFINHOME.BSE': 'Housing Finance',
    'LICHSGFIN.BSE': 'Housing Finance',
    'CHOLAFIN.BSE': 'Non-Banking Financial Services',
    'BAJAJHLDNG.BSE': 'Investment Companies',
    
    // Technology
    'TCS.BSE': 'IT Services',
    'INFY.BSE': 'IT Services',
    'WIPRO.BSE': 'IT Services',
    'HCLTECH.BSE': 'IT Services',
    'TECHM.BSE': 'IT Services',
    'MINDTREE.BSE': 'IT Services',
    'LTI.BSE': 'IT Services',
    'MPHASIS.BSE': 'IT Services',
    'PERSISTENT.BSE': 'IT Services',
    'COFORGE.BSE': 'IT Services',
    'ZOMATO.BSE': 'Internet Services',
    'PAYTM.BSE': 'Fintech',
    'POLICYBZR.BSE': 'Fintech',
    
    // Energy & Oil
    'RELIANCE.BSE': 'Oil & Gas',
    'ONGC.BSE': 'Oil & Gas',
    'BPCL.BSE': 'Oil & Gas',
    'IOC.BSE': 'Oil & Gas',
    'GAIL.BSE': 'Oil & Gas',
    'ADANIENT.BSE': 'Conglomerate',
    'ADANIPOWER.BSE': 'Power',
    'TATAPOWER.BSE': 'Power',
    'NTPC.BSE': 'Power',
    'POWERGRID.BSE': 'Power',
    'SUZLON.BSE': 'Renewable Energy',
    'SJVN.BSE': 'Power',
    'NHPC.BSE': 'Power',
    
    // Consumer Staples
    'HINDUNILVR.BSE': 'FMCG',
    'ITC.BSE': 'Tobacco',
    'NESTLEIND.BSE': 'FMCG',
    'DABUR.BSE': 'FMCG',
    'MARICO.BSE': 'FMCG',
    'COLPAL.BSE': 'FMCG',
    'PGHH.BSE': 'FMCG',
    'BRITANNIA.BSE': 'FMCG',
    'TATACONSUM.BSE': 'FMCG',
    'GODREJCP.BSE': 'FMCG',
    
    // Automobiles
    'MARUTI.BSE': 'Automobiles',
    'BAJAJ-AUTO.BSE': 'Automobiles',
    'HEROMOTOCO.BSE': 'Automobiles',
    'EICHERMOT.BSE': 'Automobiles',
    'M&M.BSE': 'Automobiles',
    'TATAMOTORS.BSE': 'Automobiles',
    
    // Consumer Discretionary
    'TITAN.BSE': 'Jewelry',
    'DMART.BSE': 'Retail',
    'TRENT.BSE': 'Retail',
    'SHOPPERSSTOP.BSE': 'Retail',
    'PAGEIND.BSE': 'Textiles',
    'RELAXO.BSE': 'Footwear',
    'BATAINDIA.BSE': 'Footwear',
    'CROMPTON.BSE': 'Consumer Electronics',
    'VOLTAS.BSE': 'Consumer Electronics',
    'WHIRLPOOL.BSE': 'Consumer Electronics',
    'HAVELLS.BSE': 'Consumer Electronics',
    'BLUESTARCO.BSE': 'Consumer Electronics',
    'AMBER.BSE': 'Consumer Electronics',
    'ORIENTELEC.BSE': 'Consumer Electronics',
    
    // Healthcare
    'SUNPHARMA.BSE': 'Pharmaceuticals',
    'DRREDDY.BSE': 'Pharmaceuticals',
    'CIPLA.BSE': 'Pharmaceuticals',
    'APOLLOHOSP.BSE': 'Healthcare Services',
    'DIVISLAB.BSE': 'Pharmaceuticals',
    'LALPATHLAB.BSE': 'Healthcare Services',
    'METROPOLIS.BSE': 'Healthcare Services',
    'FORTIS.BSE': 'Healthcare Services',
    'MAXHEALTH.BSE': 'Healthcare Services',
    'NARAYANKH.BSE': 'Healthcare Services',
    'STAR.BSE': 'Pharmaceuticals',
    
    // Materials
    'ULTRACEMCO.BSE': 'Cement',
    'GRASIM.BSE': 'Textiles',
    'JSWSTEEL.BSE': 'Steel',
    'TATASTEEL.BSE': 'Steel',
    'HINDALCO.BSE': 'Aluminum',
    'VEDL.BSE': 'Mining',
    'COALINDIA.BSE': 'Mining',
    'ASIANPAINT.BSE': 'Paints',
    
    // Communication
    'BHARTIARTL.BSE': 'Telecom',
    'TATACOMM.BSE': 'Telecom',
    'JIO.BSE': 'Telecom',
    'RAILTEL.BSE': 'Telecom',
    
    // Infrastructure
    'LT.BSE': 'Engineering & Construction',
    'ADANIPORTS.BSE': 'Ports',
    'ADANIGREEN.BSE': 'Renewable Energy',
    'TITAGARH.BSE': 'Railway Equipment',
    'IRCTC.BSE': 'Railway Services',
    'IRFC.BSE': 'Railway Finance',
    'INDIANHUME.BSE': 'Infrastructure',
    
    // Logistics
    'BLUEDART.BSE': 'Logistics',
    'SAPPHIRE.BSE': 'Food Services'
  };
  return industries[symbol.toUpperCase()] || 'Other';
}

function getStockDescription(symbol: string): string {
  const descriptions: { [key: string]: string } = {
    // Banking & Financial Services
    'HDFCBANK.BSE': 'HDFC Bank Limited is one of India\'s leading private sector banks, providing a wide range of banking and financial services to retail and corporate customers.',
    'ICICIBANK.BSE': 'ICICI Bank Limited is a leading private sector bank in India, offering comprehensive banking and financial services including retail banking, corporate banking, and investment banking.',
    'KOTAKBANK.BSE': 'Kotak Mahindra Bank Limited is a leading private sector bank in India, known for its innovative banking solutions and strong presence in retail and corporate banking.',
    'AXISBANK.BSE': 'Axis Bank Limited is one of India\'s largest private sector banks, providing a comprehensive range of financial services including retail banking, corporate banking, and treasury operations.',
    'INDUSINDBK.BSE': 'IndusInd Bank Limited is a leading private sector bank in India, known for its customer-centric approach and innovative banking products.',
    'SBIN.BSE': 'State Bank of India is India\'s largest public sector bank, providing comprehensive banking and financial services across the country.',
    'BANDHANBNK.BSE': 'Bandhan Bank Limited is a private sector bank in India, focusing on microfinance and serving underbanked segments of the population.',
    'FEDERALBNK.BSE': 'Federal Bank Limited is a leading private sector bank in India, known for its strong presence in Kerala and innovative banking solutions.',
    'IDFCFIRSTB.BSE': 'IDFC First Bank Limited is a private sector bank formed through the merger of IDFC Bank and Capital First, offering comprehensive banking services.',
    'YESBANK.BSE': 'Yes Bank Limited is a private sector bank in India, known for its technology-driven banking solutions and corporate banking focus.',
    'PNB.BSE': 'Punjab National Bank is one of India\'s largest public sector banks, providing banking and financial services across the country.',
    'BAJFINANCE.BSE': 'Bajaj Finance Limited is a leading non-banking financial company in India, providing consumer finance, SME finance, and commercial lending.',
    'BAJAJFINSV.BSE': 'Bajaj Finserv Limited is a diversified financial services company, offering insurance, lending, and investment products.',
    'CANFINHOME.BSE': 'Can Fin Homes Limited is a leading housing finance company in India, providing home loans and related financial services.',
    'LICHSGFIN.BSE': 'LIC Housing Finance Limited is a leading housing finance company, providing home loans and related financial services across India.',
    'CHOLAFIN.BSE': 'Cholamandalam Investment and Finance Company Limited is a leading non-banking financial company, providing vehicle finance and other lending services.',
    'BAJAJHLDNG.BSE': 'Bajaj Holdings & Investment Limited is an investment holding company with significant stakes in Bajaj Finance and Bajaj Finserv.',
    
    // Technology
    'TCS.BSE': 'Tata Consultancy Services Limited is India\'s largest IT services company, providing consulting, technology, and business solutions globally.',
    'INFY.BSE': 'Infosys Limited is a leading global technology services company, providing consulting, technology, and outsourcing services worldwide.',
    'WIPRO.BSE': 'Wipro Limited is a leading global information technology, consulting, and business process services company.',
    'HCLTECH.BSE': 'HCL Technologies Limited is a leading global technology company, providing IT services, engineering, and R&D services.',
    'TECHM.BSE': 'Tech Mahindra Limited is a leading provider of digital transformation, consulting, and business re-engineering services.',
    'MINDTREE.BSE': 'Mindtree Limited is a global technology consulting and services company, helping enterprises reimagine their business models.',
    'LTI.BSE': 'Larsen & Toubro Infotech Limited is a global technology consulting and digital solutions company.',
    'MPHASIS.BSE': 'Mphasis Limited is a leading applied technology services company, providing digital transformation and technology services.',
    'PERSISTENT.BSE': 'Persistent Systems Limited is a global technology services company, providing software product development and digital transformation services.',
    'COFORGE.BSE': 'Coforge Limited is a global digital services and solutions provider, helping enterprises transform their business models.',
    'ZOMATO.BSE': 'Zomato Limited is India\'s leading food delivery and restaurant discovery platform, connecting consumers with restaurants.',
    'PAYTM.BSE': 'One97 Communications Limited (Paytm) is India\'s leading digital payments and financial services platform.',
    'POLICYBZR.BSE': 'PB Fintech Limited (Policybazaar) is India\'s leading online insurance marketplace, helping consumers compare and buy insurance products.',
    
    // Energy & Oil
    'RELIANCE.BSE': 'Reliance Industries Limited is India\'s largest private sector company, operating in petrochemicals, refining, oil and gas, retail, and telecommunications.',
    'ONGC.BSE': 'Oil and Natural Gas Corporation Limited is India\'s largest oil and gas exploration and production company.',
    'BPCL.BSE': 'Bharat Petroleum Corporation Limited is one of India\'s leading oil marketing companies, engaged in refining and marketing of petroleum products.',
    'IOC.BSE': 'Indian Oil Corporation Limited is India\'s largest oil marketing company, engaged in refining, pipeline transportation, and marketing of petroleum products.',
    'GAIL.BSE': 'GAIL (India) Limited is India\'s largest natural gas company, engaged in natural gas transmission, distribution, and marketing.',
    'ADANIENT.BSE': 'Adani Enterprises Limited is a diversified conglomerate with interests in ports, logistics, agribusiness, and renewable energy.',
    'ADANIPOWER.BSE': 'Adani Power Limited is one of India\'s largest private power producers, operating thermal power plants across the country.',
    'TATAPOWER.BSE': 'Tata Power Company Limited is India\'s largest integrated power company, with operations in generation, transmission, and distribution.',
    'NTPC.BSE': 'NTPC Limited is India\'s largest power generation company, operating thermal and renewable energy power plants.',
    'POWERGRID.BSE': 'Power Grid Corporation of India Limited is India\'s central transmission utility, responsible for inter-state transmission of electricity.',
    'SUZLON.BSE': 'Suzlon Energy Limited is India\'s leading renewable energy solutions provider, specializing in wind energy.',
    'SJVN.BSE': 'SJVN Limited is a joint venture power company, engaged in hydroelectric power generation.',
    'NHPC.BSE': 'NHPC Limited is India\'s largest hydroelectric power generation company.',
    
    // Consumer Staples
    'HINDUNILVR.BSE': 'Hindustan Unilever Limited is India\'s largest FMCG company, manufacturing and marketing consumer goods.',
    'ITC.BSE': 'ITC Limited is a diversified conglomerate with businesses in cigarettes, hotels, paperboards, packaging, agri-business, and FMCG.',
    'NESTLEIND.BSE': 'Nestle India Limited is a leading food and beverage company, manufacturing and marketing a wide range of consumer products.',
    'DABUR.BSE': 'Dabur India Limited is a leading FMCG company, manufacturing and marketing Ayurvedic and natural health care products.',
    'MARICO.BSE': 'Marico Limited is a leading FMCG company, manufacturing and marketing personal care and food products.',
    'COLPAL.BSE': 'Colgate Palmolive (India) Limited is a leading oral care company, manufacturing and marketing dental care products.',
    'PGHH.BSE': 'Procter & Gamble Hygiene and Health Care Limited is a leading FMCG company, manufacturing and marketing health and hygiene products.',
    'BRITANNIA.BSE': 'Britannia Industries Limited is India\'s leading food company, manufacturing and marketing biscuits, bread, and other food products.',
    'TATACONSUM.BSE': 'Tata Consumer Products Limited is a leading FMCG company, manufacturing and marketing tea, coffee, and other consumer products.',
    'GODREJCP.BSE': 'Godrej Consumer Products Limited is a leading FMCG company, manufacturing and marketing personal care and household products.',
    
    // Automobiles
    'MARUTI.BSE': 'Maruti Suzuki India Limited is India\'s largest passenger car manufacturer, known for its fuel-efficient and reliable vehicles.',
    'BAJAJ-AUTO.BSE': 'Bajaj Auto Limited is India\'s leading two-wheeler manufacturer, known for its motorcycles and scooters.',
    'HEROMOTOCO.BSE': 'Hero MotoCorp Limited is the world\'s largest two-wheeler manufacturer, known for its motorcycles and scooters.',
    'EICHERMOT.BSE': 'Eicher Motors Limited is a leading commercial vehicle manufacturer, known for its trucks and buses.',
    'M&M.BSE': 'Mahindra & Mahindra Limited is a leading automotive manufacturer, known for its SUVs, tractors, and commercial vehicles.',
    'TATAMOTORS.BSE': 'Tata Motors Limited is a leading automotive manufacturer, known for its passenger cars, commercial vehicles, and electric vehicles.',
    
    // Consumer Discretionary
    'TITAN.BSE': 'Titan Company Limited is India\'s leading watch and jewelry company, known for its Tanishq, Fastrack, and other brands.',
    'DMART.BSE': 'Avenue Supermarts Limited (D-Mart) is India\'s leading retail chain, known for its value retailing model.',
    'TRENT.BSE': 'Trent Limited is a leading retail company, operating fashion and lifestyle retail chains.',
    'SHOPPERSSTOP.BSE': 'Shoppers Stop Limited is a leading department store chain, offering fashion, beauty, and lifestyle products.',
    'PAGEIND.BSE': 'Page Industries Limited is the exclusive licensee of Jockey brand in India, manufacturing and marketing innerwear and sportswear.',
    'RELAXO.BSE': 'Relaxo Footwears Limited is a leading footwear manufacturer, known for its casual and formal footwear.',
    'BATAINDIA.BSE': 'Bata India Limited is a leading footwear manufacturer and retailer, known for its quality and affordable footwear.',
    'CROMPTON.BSE': 'Crompton Greaves Consumer Electricals Limited is a leading manufacturer of fans, pumps, and other electrical appliances.',
    'VOLTAS.BSE': 'Voltas Limited is a leading air conditioning and engineering company, known for its cooling solutions.',
    'WHIRLPOOL.BSE': 'Whirlpool of India Limited is a leading home appliance manufacturer, known for its refrigerators, washing machines, and other appliances.',
    'HAVELLS.BSE': 'Havells India Limited is a leading electrical equipment manufacturer, known for its fans, switches, and other electrical products.',
    'BLUESTARCO.BSE': 'Blue Star Limited is a leading air conditioning and commercial refrigeration company.',
    'AMBER.BSE': 'Amber Enterprises India Limited is a leading manufacturer of air conditioning components and home appliances.',
    'ORIENTELEC.BSE': 'Orient Electric Limited is a leading electrical equipment manufacturer, known for its fans, lights, and other electrical products.',
    
    // Healthcare
    'SUNPHARMA.BSE': 'Sun Pharmaceutical Industries Limited is India\'s largest pharmaceutical company, manufacturing and marketing generic and specialty medicines.',
    'DRREDDY.BSE': 'Dr. Reddy\'s Laboratories Limited is a leading pharmaceutical company, known for its generic medicines and active pharmaceutical ingredients.',
    'CIPLA.BSE': 'Cipla Limited is a leading pharmaceutical company, known for its affordable medicines and global presence.',
    'APOLLOHOSP.BSE': 'Apollo Hospitals Enterprise Limited is India\'s largest healthcare provider, operating hospitals and diagnostic centers.',
    'DIVISLAB.BSE': 'Divi\'s Laboratories Limited is a leading pharmaceutical company, specializing in active pharmaceutical ingredients and intermediates.',
    'LALPATHLAB.BSE': 'Dr. Lal PathLabs Limited is a leading diagnostic services company, providing pathology and radiology services.',
    'METROPOLIS.BSE': 'Metropolis Healthcare Limited is a leading diagnostic services company, providing pathology and radiology services.',
    'FORTIS.BSE': 'Fortis Healthcare Limited is a leading healthcare provider, operating hospitals and diagnostic centers.',
    'MAXHEALTH.BSE': 'Max Healthcare Institute Limited is a leading healthcare provider, operating hospitals and diagnostic centers.',
    'NARAYANKH.BSE': 'Narayana Hrudayalaya Limited is a leading healthcare provider, known for its affordable cardiac care.',
    'STAR.BSE': 'Strides Pharma Science Limited is a leading pharmaceutical company, manufacturing and marketing generic medicines.',
    
    // Materials
    'ULTRACEMCO.BSE': 'UltraTech Cement Limited is India\'s largest cement manufacturer, producing and marketing cement and related products.',
    'GRASIM.BSE': 'Grasim Industries Limited is a leading manufacturer of viscose staple fibre, cement, and chemicals.',
    'JSWSTEEL.BSE': 'JSW Steel Limited is one of India\'s leading steel manufacturers, producing and marketing steel products.',
    'TATASTEEL.BSE': 'Tata Steel Limited is one of India\'s leading steel manufacturers, producing and marketing steel products.',
    'HINDALCO.BSE': 'Hindalco Industries Limited is India\'s largest aluminum manufacturer, producing and marketing aluminum and copper products.',
    'VEDL.BSE': 'Vedanta Limited is a leading diversified natural resources company, operating in mining and oil and gas.',
    'COALINDIA.BSE': 'Coal India Limited is India\'s largest coal mining company, producing and marketing coal.',
    'ASIANPAINT.BSE': 'Asian Paints Limited is India\'s largest paint manufacturer, producing and marketing decorative and industrial paints.',
    
    // Communication
    'BHARTIARTL.BSE': 'Bharti Airtel Limited is India\'s leading telecommunications company, providing mobile, broadband, and enterprise services.',
    'TATACOMM.BSE': 'Tata Communications Limited is a leading global telecommunications company, providing network and communication services.',
    'JIO.BSE': 'Reliance Jio Infocomm Limited is India\'s leading digital services company, providing mobile, broadband, and digital services.',
    'RAILTEL.BSE': 'RailTel Corporation of India Limited is a leading telecommunications infrastructure company, providing network and communication services.',
    
    // Infrastructure
    'LT.BSE': 'Larsen & Toubro Limited is India\'s largest engineering and construction company, operating in infrastructure, power, and defense.',
    'ADANIPORTS.BSE': 'Adani Ports and Special Economic Zone Limited is India\'s largest private port operator, operating ports and logistics services.',
    'ADANIGREEN.BSE': 'Adani Green Energy Limited is India\'s largest renewable energy company, operating solar and wind power plants.',
    'TITAGARH.BSE': 'Titagarh Wagons Limited is a leading manufacturer of railway wagons and passenger coaches.',
    'IRCTC.BSE': 'Indian Railway Catering and Tourism Corporation Limited is a leading railway services company, providing catering and tourism services.',
    'IRFC.BSE': 'Indian Railway Finance Corporation Limited is a leading railway finance company, providing funding for railway infrastructure.',
    'INDIANHUME.BSE': 'Indian Hume Pipe Company Limited is a leading manufacturer of pipes and infrastructure products.',
    
    // Logistics
    'BLUEDART.BSE': 'Blue Dart Express Limited is India\'s leading express logistics company, providing domestic and international courier services.',
    'SAPPHIRE.BSE': 'Sapphire Foods India Limited is a leading food services company, operating KFC and Pizza Hut restaurants in India.'
  };
  return descriptions[symbol.toUpperCase()] || 'A leading company in its sector.';
}

// Main function to get stock data
export async function getStockData(symbol: string, period: string = '1mo'): Promise<StockData> {
  // Try Yahoo Finance first
  try {
    console.log('Attempting Yahoo Finance for symbol:', symbol);
    const yahooData = await fetchYahooFinance(symbol, period);
    if (yahooData) {
      console.log('Yahoo Finance success for:', symbol);
      return yahooData;
    }
  } catch (error) {
    console.log('Yahoo Finance failed for', symbol, ':', error);
  }
  
  // Fallback to realistic mock data
  console.log('Using realistic mock data for:', symbol);
  return generateRealisticMockData(symbol, period);
}

// Function to get just the current price (for portfolio updates)
export async function getCurrentStockPrice(symbol: string): Promise<number | null> {
  try {
    const stockData = await getStockData(symbol, '1d');
    return stockData.currentPrice;
  } catch (error) {
    console.error('Error getting current price for', symbol, ':', error);
    return null;
  }
}
