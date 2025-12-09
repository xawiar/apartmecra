import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Lazy loading image component with optimization
 * Supports WebP format, responsive images, and loading states
 */
const LazyImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  width,
  height,
  quality = 80,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Zw7xrbGVuaXlvci4uLjwvdGV4dD48L3N2Zz4=',
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Optimize image URL for Firebase Storage - memoized
  const optimizeImageUrl = useMemo(() => {
    return (url, targetWidth, targetQuality = quality) => {
      if (!url) return '';
      
      // Firebase Storage optimization
      if (url.includes('firebasestorage')) {
        const params = [];
        if (targetWidth) params.push(`width=${targetWidth}`);
        if (targetQuality) params.push(`quality=${targetQuality}`);
        if (params.length > 0) {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}${params.join('&')}`;
        }
      }
      
      return url;
    };
  }, [quality]);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    // Use Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const optimizedSrc = optimizeImageUrl(src, width);
              setImageSrc(optimizedSrc);
              observerRef.current.disconnect();
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before image enters viewport
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      // Fallback for browsers without IntersectionObserver
      const optimizedSrc = optimizeImageUrl(src, width);
      setImageSrc(optimizedSrc);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, width, quality]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(false);
    if (onError) onError(e);
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0.5,
        transition: 'opacity 0.3s ease-in-out',
      }}
      width={width}
      height={height}
      loading="lazy"
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default LazyImage;

