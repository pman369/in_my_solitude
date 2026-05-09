'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 2 minutes by default
            staleTime: 2 * 60 * 1000,
            // Hold unused data in memory for 5 minutes (covers back navigation)
            gcTime: 5 * 60 * 1000,
            // Don't hammer the server on tab focus
            refetchOnWindowFocus: false,
            // Retry failed requests once with 1 s delay
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
