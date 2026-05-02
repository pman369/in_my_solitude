/**
 * Centralized logging utility for In My Solitude.
 * Supports different log levels and can be extended to send logs to external services (e.g., Sentry).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private log(entry: LogMessage) {
    const { level, message, context, error } = entry;
    const timestamp = new Date().toISOString();
    
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (!this.isProduction) {
      const consoleMethod = level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warn' : 'error';
      console[consoleMethod](formattedMessage, context || '', error || '');
    } else {
      // In production, we only log to console if it's a critical error, 
      // otherwise we would send to an external observability tool.
      if (level === 'error' || level === 'warn') {
        console[level](formattedMessage, context || '', error || '');
      }
      
      // TODO: Integrate with Sentry or other logging service
      // if (typeof window === 'undefined') {
      //   // Server-side logging
      // } else {
      //   // Client-side logging
      // }
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log({ level: 'info', message, context });
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log({ level: 'warn', message, context, error });
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log({ level: 'error', message, context, error });
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log({ level: 'debug', message, context });
  }
}

export const logger = new Logger();
