import { useState, useEffect } from 'react';

/**
 * Breakpoint definitions matching Bootstrap breakpoints
 */
const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
};

/**
 * Custom hook for responsive design
 * Provides window size and breakpoint information
 * @returns {Object} Responsive state and utilities
 * 
 * @example
 * const { isMobile, isTablet, isDesktop, windowSize } = useResponsive();
 * 
 * if (isMobile) {
 *   return <MobileView />;
 * }
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Set initial size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < BREAKPOINTS.md;
  const isTablet = windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg;
  const isDesktop = windowSize.width >= BREAKPOINTS.lg;
  const isLargeDesktop = windowSize.width >= BREAKPOINTS.xl;

  const isXs = windowSize.width < BREAKPOINTS.sm;
  const isSm = windowSize.width >= BREAKPOINTS.sm && windowSize.width < BREAKPOINTS.md;
  const isMd = windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg;
  const isLg = windowSize.width >= BREAKPOINTS.lg && windowSize.width < BREAKPOINTS.xl;
  const isXl = windowSize.width >= BREAKPOINTS.xl;

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    breakpoints: BREAKPOINTS
  };
};

export default useResponsive;

