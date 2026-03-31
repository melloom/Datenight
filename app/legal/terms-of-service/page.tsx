'use client';

import React, { useState } from 'react';
import TermsOfService from '@/components/ui/TermsOfService';
import ScrollableDocument from '@/components/ui/ScrollableDocument';
import { useLegal } from '@/lib/legal-context';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  const { hasScrolledTerms, setHasScrolledTerms } = useLegal();

  const handleScrollEnd = () => {
    setHasScrolledTerms(true);
    console.log("Scrolled to the end of Terms of Service");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b" 
           style={{
             paddingTop: 'env(safe-area-inset-top, 0px)',
           }}>
        <div className="flex items-center gap-4 px-4 py-3" 
             style={{
               paddingLeft: 'max(env(safe-area-inset-left, 0px), 1rem)',
               paddingRight: 'max(env(safe-area-inset-right, 0px), 1rem)',
             }}>
          <Link 
            href="/login"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">Terms of Service</h1>
        </div>
      </div>

      {/* Document content */}
      <div className="px-4 pb-4">
        <ScrollableDocument onScrollEnd={handleScrollEnd}>
          <TermsOfService />
        </ScrollableDocument>
      </div>
    </div>
  );
}
