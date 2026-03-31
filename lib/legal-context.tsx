'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LegalContextType {
  hasScrolledTerms: boolean;
  setHasScrolledTerms: (value: boolean) => void;
  hasScrolledPrivacy: boolean;
  setHasScrolledPrivacy: (value: boolean) => void;
}

const LegalContext = createContext<LegalContextType | undefined>(undefined);

export const LegalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);

  return (
    <LegalContext.Provider value={{ hasScrolledTerms, setHasScrolledTerms, hasScrolledPrivacy, setHasScrolledPrivacy }}>
      {children}
    </LegalContext.Provider>
  );
};

export const useLegal = () => {
  const context = useContext(LegalContext);
  if (context === undefined) {
    throw new Error('useLegal must be used within a LegalProvider');
  }
  return context;
};
