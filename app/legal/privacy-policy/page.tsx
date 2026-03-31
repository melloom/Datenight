'use client';

import React, { useState } from 'react';
import PrivacyPolicy from '@/components/ui/PrivacyPolicy';
import ScrollableDocument from '@/components/ui/ScrollableDocument';

export default function PrivacyPolicyPage() {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const handleScrollEnd = () => {
    setHasScrolledToEnd(true);
    // Here you would typically also notify the parent component (e.g., the login screen)
    // that this document has been fully scrolled. We will handle this in a later step.
    console.log("Scrolled to the end of Privacy Policy");
  };

  return (
    <ScrollableDocument onScrollEnd={handleScrollEnd}>
      <PrivacyPolicy />
    </ScrollableDocument>
  );
}
