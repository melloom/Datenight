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
    <div ref={scrollRef} style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '1rem' }}>
      {children}
    </div>
  );
};

export default ScrollableDocument;
