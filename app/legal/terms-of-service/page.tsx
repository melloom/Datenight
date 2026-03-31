'use client';

import React, { useState } from 'react';
import TermsOfService from '@/components/ui/TermsOfService';
import ScrollableDocument from '@/components/ui/ScrollableDocument';

export default function TermsOfServicePage() {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const handleScrollEnd = () => {
    setHasScrolledToEnd(true);
    // Here you would typically also notify the parent component (e.g., the login screen)
    // that this document has been fully scrolled. We will handle this in a later step.
    console.log("Scrolled to the end of Terms of Service");
  };

  return (
    <ScrollableDocument onScrollEnd={handleScrollEnd}>
      <TermsOfService />
    </ScrollableDocument>
  );
}
