import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol || symbol.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "symbol" is required' },
        { status: 400 }
      );
    }

    // Try to get a quote for the symbol to validate it exists
    try {
      const quote = await yahooFinance.quote(symbol.toUpperCase()) as any;

      if (quote && quote.symbol) {
        return NextResponse.json({
          valid: true,
          symbol: quote.symbol,
          name: quote.shortName || quote.longName || quote.symbol,
          price: quote.regularMarketPrice,
          currency: quote.currency,
          exchange: quote.fullExchangeName || quote.exchange,
          type: quote.quoteType,
        });
      } else {
        return NextResponse.json({
          valid: false,
          symbol: symbol.toUpperCase(),
          error: 'Symbol not found',
        });
      }
    } catch (quoteError: any) {
      // If quote fails, the symbol likely doesn't exist
      return NextResponse.json({
        valid: false,
        symbol: symbol.toUpperCase(),
        error: 'Symbol not found or not tradeable',
      });
    }
  } catch (error: any) {
    console.error('Symbol validation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate symbol',
        details: error.message
      },
      { status: 500 }
    );
  }
}
