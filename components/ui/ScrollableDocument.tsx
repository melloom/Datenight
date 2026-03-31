import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface ScrollableDocumentProps {
  children: ReactNode;
  onScrollEnd: () => void;
}

const ScrollableDocument: React.FC<ScrollableDocumentProps> = ({ children, onScrollEnd }) => {
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 5) { // 5px buffer
        setIsScrolledToEnd(true);
        onScrollEnd();
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
    <div 
      ref={scrollRef} 
      className="w-full h-[70vh] max-h-[600px] min-h-[400px] overflow-y-auto bg-card rounded-lg border shadow-sm"
      style={{
        // Safe area insets for notched devices
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="p-4 md:p-6 lg:p-8">
        {children}
      </div>
      
      {/* Scroll indicator */}
      {!isScrolledToEnd && (
        <div className="sticky bottom-0 left-0 right-0 bg-linear-to-t from-background to-transparent p-4 pointer-events-none">
          <div className="text-center text-xs text-muted-foreground animate-pulse">
            Scroll to bottom to continue ↓
          </div>
        </div>
      )}
      
      {/* Completion indicator */}
      {isScrolledToEnd && (
        <div className="sticky bottom-0 left-0 right-0 bg-green-50 dark:bg-green-900/20 p-4 border-t border-green-200 dark:border-green-800">
          <div className="text-center text-xs text-green-700 dark:text-green-300">
            ✓ Document fully read
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollableDocument;
