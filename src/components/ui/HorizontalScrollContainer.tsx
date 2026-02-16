import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  gap?: number;
  showArrows?: 'always' | 'desktop' | 'never';
}

export const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
  className,
  style,
  gap = 12,
  showArrows = 'desktop',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Check if we're on desktop
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5); // Add small threshold
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // Add small threshold
  };

  useEffect(() => {
    // Small delay to ensure content is rendered
    setTimeout(checkScroll, 100);
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Also check on resize
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(container);

      // Check when images load
      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        if (img.complete) {
          checkScroll();
        } else {
          img.addEventListener('load', checkScroll);
        }
      });

      return () => {
        container.removeEventListener('scroll', checkScroll);
        resizeObserver.disconnect();
        images.forEach((img) => img.removeEventListener('load', checkScroll));
      };
    }
  }, [children]); // Re-check when children change

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    // Don't scroll if we can't scroll in that direction
    if (direction === 'left' && !canScrollLeft) return;
    if (direction === 'right' && !canScrollRight) return;

    const scrollAmount = scrollRef.current.clientWidth * 0.8; // Scroll 80% of container width
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });

    // Re-check scroll position after animation
    setTimeout(checkScroll, 300);
  };

  const shouldShowArrows = showArrows === 'always' || (showArrows === 'desktop' && isDesktop);

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {/* Left Arrow */}
      {shouldShowArrows && canScrollLeft && (
        <Tooltip title="Nach links scrollen" arrow>
          <button
            onClick={() => scroll('left')}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '20px 8px 20px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0 8px 8px 0',
              backdropFilter: 'blur(4px)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
          >
            <ChevronLeft style={{ fontSize: '28px' }} />
          </button>
        </Tooltip>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: `${gap}px`,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          ...(shouldShowArrows && canScrollLeft ? { paddingLeft: '40px' } : {}),
          ...(shouldShowArrows && canScrollRight ? { paddingRight: '40px' } : {}),
        }}
        className="hide-scrollbar"
      >
        {children}
      </div>

      {/* Right Arrow */}
      {shouldShowArrows && canScrollRight && (
        <Tooltip title="Nach rechts scrollen" arrow>
          <button
            onClick={() => scroll('right')}
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background:
                'linear-gradient(270deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '20px 4px 20px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px 0 0 8px',
              backdropFilter: 'blur(4px)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
          >
            <ChevronRight style={{ fontSize: '28px' }} />
          </button>
        </Tooltip>
      )}

      {/* CSS for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
