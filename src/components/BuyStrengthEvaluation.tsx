'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Activity, Brain, Loader2 } from 'lucide-react';

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

interface BuyStrengthEvaluationProps {
  stockData: StockData;
  isOpen: boolean;
  onClose: () => void;
}

interface SentimentData {
  overallSentiment: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE';
  sentimentScore: number;
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

interface AnalysisResult {
  score: number;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  }>;
  summary: string;
  sentimentData?: SentimentData;
}

export default function BuyStrengthEvaluation({ stockData, isOpen, onClose }: BuyStrengthEvaluationProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);

  // Fetch sentiment data when component opens or stock changes
  useEffect(() => {
    if (isOpen && !isLoadingSentiment) {
      // Reset sentiment data when stock changes
      setSentimentData(null);
      setSentimentError(null);
      fetchSentimentData();
    }
  }, [isOpen, stockData.symbol]); // Add stockData.symbol as dependency

  const fetchSentimentData = async () => {
    setIsLoadingSentiment(true);
    setSentimentError(null);
    
    try {
      const response = await fetch('/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: stockData.symbol,
          name: stockData.name,
          sector: stockData.sector,
          industry: stockData.industry,
          currentPrice: stockData.currentPrice,
          changePercent: stockData.changePercent,
          volume: stockData.volume,
          marketCap: stockData.marketCap,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sentiment data');
      }

      const data = await response.json();
      setSentimentData(data);
    } catch (error) {
      console.error('Error fetching sentiment:', error);
      setSentimentError(error instanceof Error ? error.message : 'Failed to fetch sentiment data');
    } finally {
      setIsLoadingSentiment(false);
    }
  };

  if (!isOpen) return null;

  // Analysis function based on available data
  const analyzeStock = (data: StockData, sentiment?: SentimentData | null): AnalysisResult => {
    const factors: AnalysisResult['factors'] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // TECHNICAL INDICATORS (60% total weight)
    // 1. Price Trend Analysis (18% weight - reduced from 30%)
    const historicalData = data.historicalData;
    const firstPrice = historicalData[0]?.close || 0;
    const lastPrice = historicalData[historicalData.length - 1]?.close || 0;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    let trendScore = 0;
    let trendDescription = '';
    let trendImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';

    if (priceChange > 5) {
      trendScore = 8;
      trendDescription = `Strong uptrend: +${priceChange.toFixed(1)}% over period`;
      trendImpact = 'POSITIVE';
    } else if (priceChange > 2) {
      trendScore = 6;
      trendDescription = `Moderate uptrend: +${priceChange.toFixed(1)}% over period`;
      trendImpact = 'POSITIVE';
    } else if (priceChange > -2) {
      trendScore = 4;
      trendDescription = `Sideways movement: ${priceChange.toFixed(1)}% over period`;
      trendImpact = 'NEUTRAL';
    } else if (priceChange > -5) {
      trendScore = 2;
      trendDescription = `Moderate downtrend: ${priceChange.toFixed(1)}% over period`;
      trendImpact = 'NEGATIVE';
    } else {
      trendScore = 0;
      trendDescription = `Strong downtrend: ${priceChange.toFixed(1)}% over period`;
      trendImpact = 'NEGATIVE';
    }

    factors.push({
      name: 'Price Trend',
      score: trendScore,
      weight: 18,
      description: trendDescription,
      impact: trendImpact
    });

    // 2. Volume Analysis (12% weight - reduced from 20%)
    const currentVolume = data.volume;
    const avgVolume = data.avgVolume;
    const volumeRatio = currentVolume / avgVolume;
    
    let volumeScore = 0;
    let volumeDescription = '';
    let volumeImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';

    if (volumeRatio > 2) {
      volumeScore = 8;
      volumeDescription = `High volume activity: ${(volumeRatio * 100).toFixed(0)}% of average`;
      volumeImpact = 'POSITIVE';
    } else if (volumeRatio > 1.5) {
      volumeScore = 6;
      volumeDescription = `Above average volume: ${(volumeRatio * 100).toFixed(0)}% of average`;
      volumeImpact = 'POSITIVE';
    } else if (volumeRatio > 0.8) {
      volumeScore = 4;
      volumeDescription = `Normal volume: ${(volumeRatio * 100).toFixed(0)}% of average`;
      volumeImpact = 'NEUTRAL';
    } else {
      volumeScore = 2;
      volumeDescription = `Low volume: ${(volumeRatio * 100).toFixed(0)}% of average`;
      volumeImpact = 'NEGATIVE';
    }

    factors.push({
      name: 'Volume Analysis',
      score: volumeScore,
      weight: 12,
      description: volumeDescription,
      impact: volumeImpact
    });

    // 3. Support/Resistance Analysis (9% weight - reduced from 15%)
    const prices = historicalData.map(d => d.close);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const currentPrice = data.currentPrice;
    const priceRange = maxPrice - minPrice;
    const positionInRange = (currentPrice - minPrice) / priceRange;
    
    let supportResistanceScore = 0;
    let supportResistanceDescription = '';
    let supportResistanceImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';

    if (positionInRange > 0.8) {
      supportResistanceScore = 3;
      supportResistanceDescription = `Near resistance level (${(positionInRange * 100).toFixed(0)}% of range)`;
      supportResistanceImpact = 'NEGATIVE';
    } else if (positionInRange < 0.2) {
      supportResistanceScore = 7;
      supportResistanceDescription = `Near support level (${(positionInRange * 100).toFixed(0)}% of range)`;
      supportResistanceImpact = 'POSITIVE';
    } else {
      supportResistanceScore = 5;
      supportResistanceDescription = `Mid-range position (${(positionInRange * 100).toFixed(0)}% of range)`;
      supportResistanceImpact = 'NEUTRAL';
    }

    factors.push({
      name: 'Support/Resistance',
      score: supportResistanceScore,
      weight: 9,
      description: supportResistanceDescription,
      impact: supportResistanceImpact
    });

    // 4. Volatility Analysis (9% weight - reduced from 15%)
    const priceChanges = historicalData.slice(1).map((d, i) => 
      Math.abs(d.close - historicalData[i].close) / historicalData[i].close
    );
    const avgVolatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const volatilityPercent = avgVolatility * 100;
    
    let volatilityScore = 0;
    let volatilityDescription = '';
    let volatilityImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';

    if (volatilityPercent < 1) {
      volatilityScore = 7;
      volatilityDescription = `Low volatility: ${volatilityPercent.toFixed(2)}% average daily change`;
      volatilityImpact = 'POSITIVE';
    } else if (volatilityPercent < 2) {
      volatilityScore = 5;
      volatilityDescription = `Moderate volatility: ${volatilityPercent.toFixed(2)}% average daily change`;
      volatilityImpact = 'NEUTRAL';
    } else {
      volatilityScore = 3;
      volatilityDescription = `High volatility: ${volatilityPercent.toFixed(2)}% average daily change`;
      volatilityImpact = 'NEGATIVE';
    }

    factors.push({
      name: 'Volatility',
      score: volatilityScore,
      weight: 9,
      description: volatilityDescription,
      impact: volatilityImpact
    });

    // 5. Price Position vs 52W Range (12% weight - reduced from 20%)
    const week52Range = data.week52High - data.week52Low;
    const positionIn52W = (currentPrice - data.week52Low) / week52Range;
    
    let week52Score = 0;
    let week52Description = '';
    let week52Impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';

    if (positionIn52W > 0.9) {
      week52Score = 2;
      week52Description = `Near 52W high (${(positionIn52W * 100).toFixed(0)}% of range)`;
      week52Impact = 'NEGATIVE';
    } else if (positionIn52W < 0.1) {
      week52Score = 8;
      week52Description = `Near 52W low (${(positionIn52W * 100).toFixed(0)}% of range)`;
      week52Impact = 'POSITIVE';
    } else if (positionIn52W > 0.7) {
      week52Score = 4;
      week52Description = `Upper 52W range (${(positionIn52W * 100).toFixed(0)}% of range)`;
      week52Impact = 'NEGATIVE';
    } else if (positionIn52W < 0.3) {
      week52Score = 6;
      week52Description = `Lower 52W range (${(positionIn52W * 100).toFixed(0)}% of range)`;
      week52Impact = 'POSITIVE';
    } else {
      week52Score = 5;
      week52Description = `Mid 52W range (${(positionIn52W * 100).toFixed(0)}% of range)`;
      week52Impact = 'NEUTRAL';
    }

    factors.push({
      name: '52W Position',
      score: week52Score,
      weight: 12,
      description: week52Description,
      impact: week52Impact
    });

    // MARKET SENTIMENT ANALYSIS (40% total weight)
    if (sentiment) {
      // Stock-specific sentiment (15% weight)
      factors.push({
        name: 'Stock Sentiment',
        score: sentiment.stockSentiment.score,
        weight: 15,
        description: sentiment.stockSentiment.description,
        impact: sentiment.stockSentiment.score >= 7 ? 'POSITIVE' : 
                sentiment.stockSentiment.score <= 3 ? 'NEGATIVE' : 'NEUTRAL'
      });

      // Industry sentiment (12% weight)
      factors.push({
        name: 'Industry Sentiment',
        score: sentiment.industrySentiment.score,
        weight: 12,
        description: sentiment.industrySentiment.description,
        impact: sentiment.industrySentiment.score >= 7 ? 'POSITIVE' : 
                sentiment.industrySentiment.score <= 3 ? 'NEGATIVE' : 'NEUTRAL'
      });

      // Market sentiment (13% weight)
      factors.push({
        name: 'Market Sentiment',
        score: sentiment.marketSentiment.score,
        weight: 13,
        description: sentiment.marketSentiment.description,
        impact: sentiment.marketSentiment.score >= 7 ? 'POSITIVE' : 
                sentiment.marketSentiment.score <= 3 ? 'NEGATIVE' : 'NEUTRAL'
      });
    } else {
      // Fallback sentiment factors if sentiment data is not available
      factors.push({
        name: 'Market Sentiment',
        score: 5,
        weight: 40,
        description: 'Sentiment analysis unavailable - using neutral score',
        impact: 'NEUTRAL'
      });
    }

    // Calculate weighted score
    factors.forEach(factor => {
      totalScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    });

    const finalScore = totalScore / totalWeight;
    
    // Determine signal and confidence
    let signal: AnalysisResult['signal'];
    let confidence: AnalysisResult['confidence'];
    let summary: string;

    if (finalScore >= 7) {
      signal = 'STRONG_BUY';
      confidence = finalScore >= 8 ? 'HIGH' : 'MEDIUM';
      summary = 'Strong positive indicators suggest this could be a good buying opportunity.';
    } else if (finalScore >= 5.5) {
      signal = 'BUY';
      confidence = 'MEDIUM';
      summary = 'Moderate positive indicators suggest potential buying opportunity with some caution.';
    } else if (finalScore >= 4.5) {
      signal = 'HOLD';
      confidence = 'MEDIUM';
      summary = 'Mixed signals suggest holding current position or waiting for clearer direction.';
    } else if (finalScore >= 3) {
      signal = 'SELL';
      confidence = 'MEDIUM';
      summary = 'Negative indicators suggest considering selling or avoiding new positions.';
    } else {
      signal = 'STRONG_SELL';
      confidence = finalScore <= 2 ? 'HIGH' : 'MEDIUM';
      summary = 'Strong negative indicators suggest avoiding this stock or selling existing positions.';
    }

    return {
      score: Math.round(finalScore * 10) / 10,
      signal,
      confidence,
      factors,
      summary,
      sentimentData: sentiment || undefined
    };
  };

  const analysis = analyzeStock(stockData, sentimentData);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'text-green-400 bg-green-900/20 border-green-500/50';
      case 'BUY': return 'text-green-300 bg-green-800/20 border-green-400/50';
      case 'HOLD': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50';
      case 'SELL': return 'text-red-300 bg-red-800/20 border-red-400/50';
      case 'STRONG_SELL': return 'text-red-400 bg-red-900/20 border-red-500/50';
      default: return 'text-slate-400 bg-slate-800/20 border-slate-500/50';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'POSITIVE': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'NEGATIVE': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'NEUTRAL': return <Activity className="h-4 w-4 text-yellow-400" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Buy Strength Evaluation</h2>
              <p className="text-sm text-slate-400">{stockData.name} ({stockData.symbol})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stock Info */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">{stockData.name} ({stockData.symbol})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Current Price:</span>
                <p className="text-white font-medium">₹{stockData.currentPrice}</p>
              </div>
              <div>
                <span className="text-slate-400">Change:</span>
                <p className={`font-medium ${stockData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stockData.change >= 0 ? '+' : ''}{stockData.changePercent}%
                </p>
              </div>
              <div>
                <span className="text-slate-400">Volume:</span>
                <p className="text-white">{stockData.volume >= 1000000 
                  ? `${(stockData.volume / 1000000).toFixed(1)}M` 
                  : `${(stockData.volume / 1000).toFixed(1)}K`}</p>
              </div>
              <div>
                <span className="text-slate-400">52W Range:</span>
                <p className="text-white">₹{stockData.week52Low} - ₹{stockData.week52High}</p>
              </div>
            </div>
          </div>

          {/* Overall Signal */}
          <div className={`rounded-lg p-6 border ${getSignalColor(analysis.signal)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Overall Signal</h3>
              <div className="text-right">
                <p className="text-2xl font-bold">{analysis.score}/10</p>
                <p className={`text-sm ${getConfidenceColor(analysis.confidence)}`}>
                  {analysis.confidence} Confidence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mb-3">
              {analysis.signal === 'STRONG_BUY' || analysis.signal === 'BUY' ? (
                <TrendingUp className="h-6 w-6" />
              ) : analysis.signal === 'STRONG_SELL' || analysis.signal === 'SELL' ? (
                <TrendingDown className="h-6 w-6" />
              ) : (
                <Activity className="h-6 w-6" />
              )}
              <span className="text-lg font-semibold">{analysis.signal.replace('_', ' ')}</span>
            </div>
            <p className="text-slate-300">{analysis.summary}</p>
          </div>

          {/* Sentiment Analysis Section */}
          {isLoadingSentiment && (
            <div className="bg-slate-700/50 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                <span className="text-white">Analyzing market sentiment for {stockData.name}...</span>
              </div>
            </div>
          )}

          {sentimentError && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-400 mb-1">Sentiment Analysis Error</h4>
                  <p className="text-red-200 text-sm">{sentimentError}</p>
                  <button
                    onClick={fetchSentimentData}
                    className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {sentimentData && (
            <div key={`sentiment-${stockData.symbol}`} className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Market Sentiment Analysis</h3>
                <button
                  onClick={fetchSentimentData}
                  disabled={isLoadingSentiment}
                  className="ml-auto p-2 hover:bg-purple-800/30 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh sentiment analysis"
                >
                  <Loader2 className={`h-4 w-4 text-purple-400 ${isLoadingSentiment ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Stock Sentiment</h4>
                  <div className="text-2xl font-bold text-white mb-1">{sentimentData.stockSentiment.score}/10</div>
                  <p className="text-slate-300 text-sm">{sentimentData.stockSentiment.description}</p>
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Key Factors:</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {sentimentData.stockSentiment.keyFactors.map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Industry Sentiment</h4>
                  <div className="text-2xl font-bold text-white mb-1">{sentimentData.industrySentiment.score}/10</div>
                  <p className="text-slate-300 text-sm">{sentimentData.industrySentiment.description}</p>
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Key Factors:</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {sentimentData.industrySentiment.keyFactors.map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Market Sentiment</h4>
                  <div className="text-2xl font-bold text-white mb-1">{sentimentData.marketSentiment.score}/10</div>
                  <p className="text-slate-300 text-sm">{sentimentData.marketSentiment.description}</p>
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Key Factors:</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {sentimentData.marketSentiment.keyFactors.map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Overall Sentiment Summary</h4>
                <p className="text-slate-300 text-sm">{sentimentData.summary}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-slate-400 text-sm">Confidence:</span>
                  <span className={`text-sm font-medium ${
                    sentimentData.confidence === 'HIGH' ? 'text-green-400' :
                    sentimentData.confidence === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {sentimentData.confidence}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Factors */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Technical Analysis Factors</h3>
            <div className="space-y-4">
              {analysis.factors.map((factor, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getImpactIcon(factor.impact)}
                      <span className="font-medium text-white">{factor.name}</span>
                      <span className="text-sm text-slate-400">({factor.weight}% weight)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{factor.score}/10</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm">{factor.description}</p>
                  <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        factor.impact === 'POSITIVE' ? 'bg-green-400' :
                        factor.impact === 'NEGATIVE' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${(factor.score / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-400 mb-1">Disclaimer</h4>
                <p className="text-yellow-200 text-sm">
                  This analysis combines technical indicators (60% weight) with AI-powered market sentiment analysis (40% weight). 
                  The sentiment analysis is generated by AI and may not reflect real-time market conditions. Always conduct your 
                  own research and consider consulting with a financial advisor before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
