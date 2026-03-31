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
    <div className="w-full flex flex-col">
      {/* Scroll indicator */}
      {!isScrolledToEnd && (
        <div className="bg-background/80 backdrop-blur-sm border-b p-3 text-center">
          <div className="text-xs text-muted-foreground animate-pulse">
            Scroll to bottom to continue ↓
          </div>
        </div>
      )}
      
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
