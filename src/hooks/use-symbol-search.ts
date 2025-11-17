import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  currency: string;
}

export function useSymbolSearch(query: string, debounceMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ['symbols', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        return [];
      }

      const response = await fetch(
        `/api/symbols/search?q=${encodeURIComponent(debouncedQuery)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search symbols');
      }

      const data = await response.json();
      return data.results as SymbolResult[];
    },
    enabled: debouncedQuery.trim().length > 0,
  });
}
