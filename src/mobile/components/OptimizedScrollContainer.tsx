import { useCallback, useEffect, useRef, useState } from 'react';

interface OptimizedScrollContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const OptimizedScrollContainer: React.FC<OptimizedScrollContainerProps> = ({
  children,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    if (!isScrolling) {
      setIsScrolling(true);
      document.body.classList.add('is-scrolling');
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      document.body.classList.remove('is-scrolling');
    }, 150);
  }, [isScrolling]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Use passive listener for better scroll performance
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      document.body.classList.remove('is-scrolling');
    };
  }, [handleScroll]);

  return (
    <div
      ref={scrollRef}
      className={`mobile-scroll-container ${className}`}
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)',
        willChange: 'transform',
        contain: 'layout style paint',
      }}
    >
      {children}
    </div>
  );
};
