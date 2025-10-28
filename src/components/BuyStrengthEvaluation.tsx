'use client';

import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Activity } from 'lucide-react';

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
}

export default function BuyStrengthEvaluation({ stockData, isOpen, onClose }: BuyStrengthEvaluationProps) {
  if (!isOpen) return null;

  // Analysis function based on available data
  const analyzeStock = (data: StockData): AnalysisResult => {
    const factors: AnalysisResult['factors'] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // 1. Price Trend Analysis (30% weight)
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
      weight: 30,
      description: trendDescription,
      impact: trendImpact
    });

    // 2. Volume Analysis (20% weight)
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
      weight: 20,
      description: volumeDescription,
      impact: volumeImpact
    });

    // 3. Support/Resistance Analysis (15% weight)
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
      weight: 15,
      description: supportResistanceDescription,
      impact: supportResistanceImpact
    });

    // 4. Volatility Analysis (15% weight)
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
      weight: 15,
      description: volatilityDescription,
      impact: volatilityImpact
    });

    // 5. Price Position vs 52W Range (20% weight)
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
      weight: 20,
      description: week52Description,
      impact: week52Impact
    });

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
      summary
    };
  };

  const analysis = analyzeStock(stockData);

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
            <h2 className="text-xl font-bold text-white">Buy Strength Evaluation</h2>
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

          {/* Analysis Factors */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Analysis Factors</h3>
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
                  This analysis is based solely on available price and volume data. It does not consider fundamental factors, 
                  market conditions, or external events. Always conduct your own research and consider consulting with a 
                  financial advisor before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
