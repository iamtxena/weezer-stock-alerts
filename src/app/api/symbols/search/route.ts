import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Search for symbols using yahoo-finance2
    const searchResult = await yahooFinance.search(query, {
      quotesCount: 10, // Return up to 10 matches
      newsCount: 0,    // We don't need news
    }) as any;

    // Filter and format the results
    const symbols = searchResult.quotes
      .filter((quote: any) =>
        // Only include stocks, ETFs, and crypto
        ['EQUITY', 'ETF', 'CRYPTOCURRENCY', 'MUTUALFUND'].includes(quote.quoteType)
      )
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange || quote.exchDisp || 'N/A',
        type: quote.quoteType,
        // Include additional info that might be useful
        currency: quote.currency,
      }));

    return NextResponse.json({
      query,
      results: symbols,
      count: symbols.length,
    });
  } catch (error: any) {
    console.error('Symbol search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search symbols',
        details: error.message
      },
      { status: 500 }
    );
  }
}
