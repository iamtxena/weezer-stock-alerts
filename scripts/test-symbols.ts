import yahooFinance from 'yahoo-finance2';
import { tradingViewToYahoo } from '../src/lib/symbol-mapper';

const TEST_SYMBOLS = [
  { name: 'NUKL (Nuclear)', tv: 'NUKL' },
  { name: 'COPM/ICOP (Copper)', tv: 'COPM' },
  { name: 'Bitcoin', tv: 'BTCUSD' },
  { name: 'Telefónica', tv: 'TEF' },
  { name: 'Coca-Cola', tv: 'KO' },
  { name: 'CSPX (S&P 500 ETF)', tv: 'CSPX' },
  { name: 'URA (Uranium ETF)', tv: 'URA' },
  { name: 'NVIDIA', tv: 'NVDA' },
];

async function testSymbol(tradingViewSymbol: string, name: string) {
  const yahooSymbol = tradingViewToYahoo(tradingViewSymbol);

  try {
    const quote = await yahooFinance.quote(yahooSymbol) as any;

    if (quote && quote.symbol) {
      console.log(`✅ ${name.padEnd(25)} | ${yahooSymbol.padEnd(10)} | $${quote.regularMarketPrice?.toFixed(2).padStart(10)} | ${quote.currency} | ${quote.shortName || quote.longName}`);
      return true;
    } else {
      console.log(`❌ ${name.padEnd(25)} | ${yahooSymbol.padEnd(10)} | Symbol exists but no quote data`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ ${name.padEnd(25)} | ${yahooSymbol.padEnd(10)} | ERROR: ${error.message}`);
    return false;
  }
}

async function testAllSymbols() {
  console.log('\n🧪 Testing Yahoo Finance Symbol Resolution\n');
  console.log('=' .repeat(120));
  console.log('STATUS | NAME                      | SYMBOL     | PRICE      | CURR | COMPANY NAME');
  console.log('='.repeat(120));

  let successCount = 0;
  let failCount = 0;

  for (const { name, tv } of TEST_SYMBOLS) {
    const success = await testSymbol(tv, name);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('='.repeat(120));
  console.log(`\n📊 Results: ${successCount}/${TEST_SYMBOLS.length} symbols resolved successfully\n`);

  if (failCount > 0) {
    console.log(`⚠️  ${failCount} symbol(s) failed - these may need manual mapping\n`);
  } else {
    console.log('✨ All symbols resolved successfully! Ready to import.\n');
  }
}

testAllSymbols();
