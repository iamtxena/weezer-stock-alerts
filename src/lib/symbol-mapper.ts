/**
 * Symbol mapping utility to convert TradingView symbols to Yahoo Finance format
 *
 * Yahoo Finance uses different ticker formats for international stocks:
 * - European stocks often need exchange suffixes (.PA, .AS, .L, etc.)
 * - Cryptocurrencies use -USD format (BTC-USD, ETH-USD)
 * - US stocks are usually 1:1
 */

interface SymbolMapping {
  tradingView: string;
  yahooFinance: string;
  name: string;
  exchange: string;
  notes?: string;
}

// Known symbol mappings
const SYMBOL_MAPPINGS: SymbolMapping[] = [
  // Nuclear/Uranium stocks
  {
    tradingView: 'EURONEXT:NUKL',
    yahooFinance: 'NUKL.PA',
    name: 'Nucléa SA',
    exchange: 'Euronext Paris',
  },

  // Copper/Mining stocks
  {
    tradingView: 'NASDAQ:ICOP',
    yahooFinance: 'ICOP',
    name: 'Copar LLC',
    exchange: 'NASDAQ',
  },
  {
    tradingView: 'COPM',
    yahooFinance: 'ICOP',
    name: 'Copar LLC',
    exchange: 'NASDAQ',
    notes: 'COPM is an alias for ICOP'
  },

  // Spanish stocks
  {
    tradingView: 'BME:TEF',
    yahooFinance: 'TEF.MC',
    name: 'Telefónica',
    exchange: 'Madrid Stock Exchange',
  },

  // S&P 500 ETFs
  {
    tradingView: 'LSE:CSPX',
    yahooFinance: 'CSPX.L',
    name: 'iShares Core S&P 500 UCITS ETF',
    exchange: 'London Stock Exchange',
  },

  // Uranium ETFs
  {
    tradingView: 'AMEX:URA',
    yahooFinance: 'URA',
    name: 'Global X Uranium ETF',
    exchange: 'NYSE Arca',
  },

  // Cryptocurrencies
  {
    tradingView: 'BTCUSD',
    yahooFinance: 'BTC-USD',
    name: 'Bitcoin',
    exchange: 'Cryptocurrency',
  },

  // US Stocks
  {
    tradingView: 'NYSE:KO',
    yahooFinance: 'KO',
    name: 'Coca-Cola',
    exchange: 'NYSE',
  },
  {
    tradingView: 'NASDAQ:NVDA',
    yahooFinance: 'NVDA',
    name: 'NVIDIA',
    exchange: 'NASDAQ',
  },
];

/**
 * Convert TradingView symbol to Yahoo Finance format
 */
export function tradingViewToYahoo(symbol: string): string {
  // Remove exchange prefix if present (e.g., "NASDAQ:" -> "")
  const cleanSymbol = symbol.replace(/^[A-Z]+:/, '');

  // Check if we have a known mapping
  const mapping = SYMBOL_MAPPINGS.find(
    (m) => m.tradingView === symbol || m.tradingView.endsWith(`:${cleanSymbol}`)
  );

  if (mapping) {
    return mapping.yahooFinance;
  }

  // Apply common conversion rules

  // Crypto: Convert to -USD format
  if (/^(BTC|ETH|LTC|XRP|ADA|DOT|LINK|UNI|MATIC)USD?$/.test(cleanSymbol)) {
    return cleanSymbol.replace(/USD$/, '') + '-USD';
  }

  // European stocks: Try adding .PA (Paris), .AS (Amsterdam), .MC (Madrid), .L (London)
  // This is a guess - user should validate

  // Return as-is if no match found
  return cleanSymbol;
}

/**
 * Get all known mappings for reference
 */
export function getAllMappings(): SymbolMapping[] {
  return SYMBOL_MAPPINGS;
}

/**
 * Search for a symbol mapping
 */
export function findMapping(symbol: string): SymbolMapping | undefined {
  const cleanSymbol = symbol.replace(/^[A-Z]+:/, '').toUpperCase();

  return SYMBOL_MAPPINGS.find(
    (m) =>
      m.tradingView.toUpperCase().includes(cleanSymbol) ||
      m.yahooFinance.toUpperCase() === cleanSymbol ||
      m.name.toUpperCase().includes(cleanSymbol)
  );
}
