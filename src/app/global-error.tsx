'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Critical Global Error', { digest: error.digest }, error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#0D0D0D', color: '#F0EDE6', margin: 0, fontFamily: 'sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Critical System Error</h1>
          <p style={{ color: '#9A9088', marginBottom: '2rem', maxWidth: '400px' }}>
            The application encountered a terminal error and could not recover. 
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#C9A84C',
              color: '#0D0D0D',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Attempt Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
