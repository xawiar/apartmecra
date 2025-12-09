// Production-safe logger utility
// Replaces console.log statements to prevent information leakage in production
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log information (only in development)
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  /**
   * Log errors (always logged, even in production)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(...args);
    // In production, you might want to send to error tracking service
    if (!isDev && window.Sentry) {
      window.Sentry.captureException(new Error(args.join(' ')));
    }
  },
  
  /**
   * Log warnings (only in development)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  /**
   * Log debug information (only in development)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },
  
  /**
   * Log info (only in development)
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },
  
  /**
   * Group logs (only in development)
   * @param {string} label - Group label
   */
  group: (label) => {
    if (isDev) {
      console.group(label);
    }
  },
  
  /**
   * End log group (only in development)
   */
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  }
};

export default logger;

