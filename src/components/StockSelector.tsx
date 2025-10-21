'use client';

import { useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';

interface StockSelectorProps {
  selectedStock: string;
  onStockSelect: (symbol: string) => void;
  loading: boolean;
}

// Popular Indian stocks (Yahoo Finance format)
const popularStocks = [
  // Large Cap Stocks
  { symbol: 'RELIANCE.BSE', name: 'Reliance Industries' },
  { symbol: 'TCS.BSE', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank' },
  { symbol: 'INFY.BSE', name: 'Infosys' },
  { symbol: 'HINDUNILVR.BSE', name: 'Hindustan Unilever' },
  { symbol: 'ITC.BSE', name: 'ITC Limited' },
  { symbol: 'SBIN.BSE', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL.BSE', name: 'Bharti Airtel' },
  { symbol: 'KOTAKBANK.BSE', name: 'Kotak Mahindra Bank' },
  { symbol: 'ICICIBANK.BSE', name: 'ICICI Bank' },
  { symbol: 'LT.BSE', name: 'Larsen & Toubro' },
  { symbol: 'ASIANPAINT.BSE', name: 'Asian Paints' },
  { symbol: 'MARUTI.BSE', name: 'Maruti Suzuki' },
  { symbol: 'BAJFINANCE.BSE', name: 'Bajaj Finance' },
  { symbol: 'NESTLEIND.BSE', name: 'Nestle India' },
  { symbol: 'TITAN.BSE', name: 'Titan Company' },
  { symbol: 'ULTRACEMCO.BSE', name: 'UltraTech Cement' },
  { symbol: 'WIPRO.BSE', name: 'Wipro' },
  { symbol: 'TECHM.BSE', name: 'Tech Mahindra' },
  { symbol: 'POWERGRID.BSE', name: 'Power Grid Corporation' },
  { symbol: 'NTPC.BSE', name: 'NTPC' },
  { symbol: 'ONGC.BSE', name: 'Oil and Natural Gas Corporation' },
  { symbol: 'COALINDIA.BSE', name: 'Coal India' },
  { symbol: 'SUNPHARMA.BSE', name: 'Sun Pharmaceutical' },
  { symbol: 'DRREDDY.BSE', name: 'Dr. Reddy\'s Laboratories' },
  { symbol: 'CIPLA.BSE', name: 'Cipla' },
  { symbol: 'APOLLOHOSP.BSE', name: 'Apollo Hospitals' },
  { symbol: 'DIVISLAB.BSE', name: 'Divi\'s Laboratories' },
  { symbol: 'BAJAJFINSV.BSE', name: 'Bajaj Finserv' },
  { symbol: 'BAJAJ-AUTO.BSE', name: 'Bajaj Auto' },
  { symbol: 'HEROMOTOCO.BSE', name: 'Hero MotoCorp' },
  { symbol: 'EICHERMOT.BSE', name: 'Eicher Motors' },
  { symbol: 'M&M.BSE', name: 'Mahindra & Mahindra' },
  { symbol: 'TATAMOTORS.BSE', name: 'Tata Motors' },
  { symbol: 'AXISBANK.BSE', name: 'Axis Bank' },
  { symbol: 'INDUSINDBK.BSE', name: 'IndusInd Bank' },
  { symbol: 'GRASIM.BSE', name: 'Grasim Industries' },
  { symbol: 'ADANIPORTS.BSE', name: 'Adani Ports' },
  { symbol: 'ADANIENT.BSE', name: 'Adani Enterprises' },
  { symbol: 'ADANIGREEN.BSE', name: 'Adani Green Energy' },
  { symbol: 'JSWSTEEL.BSE', name: 'JSW Steel' },
  { symbol: 'TATASTEEL.BSE', name: 'Tata Steel' },
  { symbol: 'HINDALCO.BSE', name: 'Hindalco Industries' },
  { symbol: 'VEDL.BSE', name: 'Vedanta' },
  { symbol: 'BPCL.BSE', name: 'Bharat Petroleum' },
  { symbol: 'IOC.BSE', name: 'Indian Oil Corporation' },
  { symbol: 'GAIL.BSE', name: 'GAIL (India)' },
  { symbol: 'HCLTECH.BSE', name: 'HCL Technologies' },
  { symbol: 'MINDTREE.BSE', name: 'Mindtree' },
  { symbol: 'LTI.BSE', name: 'Larsen & Toubro Infotech' },
  { symbol: 'MPHASIS.BSE', name: 'Mphasis' },
  { symbol: 'PERSISTENT.BSE', name: 'Persistent Systems' },
  { symbol: 'COFORGE.BSE', name: 'Coforge' },
  { symbol: 'ZOMATO.BSE', name: 'Zomato' },
  { symbol: 'PAYTM.BSE', name: 'Paytm' },
  { symbol: 'POLICYBZR.BSE', name: 'Policybazaar' },
  { symbol: 'IRCTC.BSE', name: 'IRCTC' },
  { symbol: 'DMART.BSE', name: 'D-Mart' },
  { symbol: 'TRENT.BSE', name: 'Trent' },
  { symbol: 'TITAGARH.BSE', name: 'Titagarh Wagons' },
  { symbol: 'RAILTEL.BSE', name: 'RailTel Corporation' },
  { symbol: 'IRFC.BSE', name: 'Indian Railway Finance' },
  { symbol: 'SJVN.BSE', name: 'SJVN' },
  { symbol: 'NHPC.BSE', name: 'NHPC' },
  { symbol: 'SAPPHIRE.BSE', name: 'Sapphire Foods' },
  { symbol: 'BANDHANBNK.BSE', name: 'Bandhan Bank' },
  { symbol: 'FEDERALBNK.BSE', name: 'Federal Bank' },
  { symbol: 'IDFCFIRSTB.BSE', name: 'IDFC First Bank' },
  { symbol: 'YESBANK.BSE', name: 'Yes Bank' },
  { symbol: 'PNB.BSE', name: 'Punjab National Bank' },
  { symbol: 'CANFINHOME.BSE', name: 'Can Fin Homes' },
  { symbol: 'LICHSGFIN.BSE', name: 'LIC Housing Finance' },
  { symbol: 'CHOLAFIN.BSE', name: 'Cholamandalam Investment' },
  { symbol: 'BAJAJHLDNG.BSE', name: 'Bajaj Holdings' },
  { symbol: 'GODREJCP.BSE', name: 'Godrej Consumer Products' },
  { symbol: 'DABUR.BSE', name: 'Dabur India' },
  { symbol: 'MARICO.BSE', name: 'Marico' },
  { symbol: 'COLPAL.BSE', name: 'Colgate Palmolive' },
  { symbol: 'PGHH.BSE', name: 'Procter & Gamble Hygiene' },
  { symbol: 'BRITANNIA.BSE', name: 'Britannia Industries' },
  { symbol: 'TATACONSUM.BSE', name: 'Tata Consumer Products' },
  { symbol: 'SHOPPERSSTOP.BSE', name: 'Shoppers Stop' },
  { symbol: 'PAGEIND.BSE', name: 'Page Industries' },
  { symbol: 'RELAXO.BSE', name: 'Relaxo Footwears' },
  { symbol: 'BATAINDIA.BSE', name: 'Bata India' },
  { symbol: 'CROMPTON.BSE', name: 'Crompton Greaves' },
  { symbol: 'VOLTAS.BSE', name: 'Voltas' },
  { symbol: 'WHIRLPOOL.BSE', name: 'Whirlpool of India' },
  { symbol: 'BLUEDART.BSE', name: 'Blue Dart Express' },
  { symbol: 'LALPATHLAB.BSE', name: 'Dr. Lal PathLabs' },
  { symbol: 'METROPOLIS.BSE', name: 'Metropolis Healthcare' },
  { symbol: 'FORTIS.BSE', name: 'Fortis Healthcare' },
  { symbol: 'MAXHEALTH.BSE', name: 'Max Healthcare' },
  { symbol: 'NARAYANKH.BSE', name: 'Narayana Hrudayalaya' },
  { symbol: 'STAR.BSE', name: 'Strides Pharma' },
  { symbol: 'INDIANHUME.BSE', name: 'Indian Hume Pipe' },
  { symbol: 'HAVELLS.BSE', name: 'Havells India' },
  { symbol: 'BLUESTARCO.BSE', name: 'Blue Star' },
  { symbol: 'AMBER.BSE', name: 'Amber Enterprises' },
  { symbol: 'ORIENTELEC.BSE', name: 'Orient Electric' },
  { symbol: 'SUZLON.BSE', name: 'Suzlon Energy' },
  { symbol: 'TATAPOWER.BSE', name: 'Tata Power' },
  { symbol: 'ADANIPOWER.BSE', name: 'Adani Power' },
  { symbol: 'TATACOMM.BSE', name: 'Tata Communications' },
  { symbol: 'JIO.BSE', name: 'Reliance Jio' }
];

export default function StockSelector({ selectedStock, onStockSelect, loading }: StockSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredStocks = popularStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStockInfo = popularStocks.find(stock => stock.symbol === selectedStock);

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Indian stocks (e.g., RELIANCE.BSE, TCS.BSE, HDFCBANK.BSE)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              suppressHydrationWarning
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      onStockSelect(stock.symbol);
                      setSearchTerm('');
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{stock.name}</p>
                        <p className="text-slate-400 text-sm">{stock.symbol}</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-slate-400">
                  No stocks found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Stock Display */}
        {selectedStockInfo && (
          <div className="flex items-center space-x-3 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-white font-medium">{selectedStockInfo.name}</p>
              <p className="text-slate-400 text-sm">{selectedStockInfo.symbol}</p>
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            )}
          </div>
        )}
      </div>

      {/* Popular Stocks Quick Select */}
      <div className="mt-4">
        <p className="text-sm text-slate-400 mb-2">Popular Stocks:</p>
        <div className="flex flex-wrap gap-2">
          {popularStocks.slice(0, 8).map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => onStockSelect(stock.symbol)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedStock === stock.symbol
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              suppressHydrationWarning
            >
              {stock.symbol.split('.')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
