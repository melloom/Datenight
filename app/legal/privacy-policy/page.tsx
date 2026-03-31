'use client';

import React, { useState } from 'react';
import PrivacyPolicy from '@/components/ui/PrivacyPolicy';
import ScrollableDocument from '@/components/ui/ScrollableDocument';
import { useLegal } from '@/lib/legal-context';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const { hasScrolledPrivacy, setHasScrolledPrivacy } = useLegal();

  const handleScrollEnd = () => {
    setHasScrolledPrivacy(true);
    console.log("Scrolled to the end of Privacy Policy");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link 
            href="/login"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </div>

      {/* Document content */}
      <div className="p-4">
        <ScrollableDocument onScrollEnd={handleScrollEnd}>
          <PrivacyPolicy />
        </ScrollableDocument>
      </div>
    </div>
  );
}
