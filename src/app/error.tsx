'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our centralized logger
    logger.error('Uncaught error in application boundary', { digest: error.digest }, error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center" style={{ background: '#0D0D0D' }}>
      <div className="mb-6 p-4 rounded-full bg-red-950/30 border border-red-900/50">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      
      <h2 className="text-2xl font-heading mb-3" style={{ color: '#F0EDE6' }}>
        Something went wrong
      </h2>
      
      <p className="max-w-md mb-8 text-sm leading-relaxed" style={{ color: '#9A9088' }}>
        An unexpected error occurred. We've been notified and are looking into it. 
        Please try refreshing the page or returning to the archive.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded text-sm font-semibold transition-all duration-200"
          style={{ background: '#C9A84C', color: '#0D0D0D' }}
        >
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
        
        <a
          href="/"
          className="flex items-center justify-center px-6 py-2.5 rounded text-sm font-semibold border transition-all duration-200"
          style={{ border: '1px solid #2A2A2A', color: '#9A9088' }}
        >
          Return Home
        </a>
      </div>
      
      {error.digest && (
        <p className="mt-12 text-[10px] uppercase tracking-widest opacity-30" style={{ color: '#9A9088' }}>
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
