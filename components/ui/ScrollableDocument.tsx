import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface ScrollableDocumentProps {
  children: ReactNode;
  onScrollEnd: () => void;
}

const ScrollableDocument: React.FC<ScrollableDocumentProps> = ({ children, onScrollEnd }) => {
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px buffer
      
      // Calculate scroll progress
      const progress = Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100);
      setScrollProgress(progress);
      
      // Update scroll end state
      if (isAtBottom && !isScrolledToEnd) {
        setIsScrolledToEnd(true);
        onScrollEnd();
      } else if (!isAtBottom && isScrolledToEnd) {
        // Allow re-scrolling if user scrolls back up
        setIsScrolledToEnd(false);
      }
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
    }

    // Initial check in case the content is not scrollable
    handleScroll();

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [onScrollEnd]);

  return (
    <div className="w-full flex flex-col">
      {/* Scroll indicator with progress */}
      <div className="bg-background/80 backdrop-blur-sm border-b p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {!isScrolledToEnd ? "Scroll to bottom to continue ↓" : "✓ Document fully read"}
            </span>
            <span className="text-muted-foreground">
              {Math.round(scrollProgress)}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-200 ${
                isScrolledToEnd ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Document content */}
      <div 
        ref={scrollRef} 
        className="flex-1 w-full h-[60vh] md:h-[70vh] lg:h-[70vh] max-h-[600px] min-h-[300px] md:min-h-[400px] overflow-y-auto bg-background"
      >
      <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 text-sm md:text-base">
        {children}
      </div>
      </div>
    </div>
  );
};

export default ScrollableDocument;
