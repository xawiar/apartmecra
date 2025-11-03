import React, { useState, useEffect } from 'react';

// Firebase kullanımı kontrolü
const USE_FIREBASE = 
  import.meta.env.VITE_USE_FIREBASE === 'true' || 
  import.meta.env.VITE_USE_FIREBASE === true ||
  String(import.meta.env.VITE_USE_FIREBASE).toLowerCase() === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname.includes('render.com') && import.meta.env.VITE_USE_FIREBASE !== undefined);

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorCount: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Monitor performance metrics
    const monitorPerformance = () => {
      // Page load time
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }

      // Memory usage (if available)
      if (performance.memory) {
        const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }

      // Network latency - Firebase kullanılıyorsa skip et (backend API yok)
      if (USE_FIREBASE) {
        setMetrics(prev => ({ ...prev, networkLatency: -1 }));
        return;
      }

      // Sadece backend API kullanılıyorsa health check yap
      const startTime = performance.now();
      fetch('http://localhost:5000/api/health')
        .then(response => {
          if (response.ok) {
            const latency = Math.round(performance.now() - startTime);
            setMetrics(prev => ({ ...prev, networkLatency: latency }));
          } else {
            setMetrics(prev => ({ ...prev, networkLatency: -1 }));
          }
        })
        .catch((error) => {
          // Silently handle connection errors - don't log them
          setMetrics(prev => ({ ...prev, networkLatency: -1 }));
        });
    };

    // Initial measurement
    monitorPerformance();

    // Monitor every 30 seconds
    const interval = setInterval(monitorPerformance, 30000);

    // Monitor errors
    const handleError = (event) => {
      setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      clearInterval(interval);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={metrics.loadTime > 3000 ? 'text-red-400' : 'text-green-400'}>
            {metrics.loadTime}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={metrics.memoryUsage > 50 ? 'text-red-400' : 'text-green-400'}>
            {metrics.memoryUsage}MB
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Network:</span>
          <span className={metrics.networkLatency > 1000 ? 'text-red-400' : 'text-green-400'}>
            {metrics.networkLatency === -1 ? 'Error' : `${metrics.networkLatency}ms`}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Errors:</span>
          <span className={metrics.errorCount > 0 ? 'text-red-400' : 'text-green-400'}>
            {metrics.errorCount}
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};

export default PerformanceMonitor;
