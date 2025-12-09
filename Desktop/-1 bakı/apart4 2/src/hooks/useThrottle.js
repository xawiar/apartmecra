import { useRef, useCallback } from 'react';

/**
 * Custom hook for throttling callback functions
 * Useful for scroll events, resize events, etc.
 * @param {Function} callback - Callback function to throttle
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} Throttled callback
 * 
 * @example
 * const throttledScroll = useThrottle(() => {
 *   handleScroll();
 * }, 300);
 * 
 * window.addEventListener('scroll', throttledScroll);
 */
export const useThrottle = (callback, delay = 300) => {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef(null);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      // Enough time has passed, execute immediately
      lastRun.current = now;
      callback(...args);
    } else {
      // Not enough time has passed, schedule execution
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastRun);
    }
  }, [callback, delay]);

  return throttledCallback;
};

export default useThrottle;

