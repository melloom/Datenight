'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ref, get, set } from 'firebase/database';
import { useAuth } from '@/lib/auth-context';
import { ensureFirebaseInitialized } from '@/lib/firebase';

const LEGAL_ACCEPTANCE_VERSION = 1;
const LEGAL_ACCEPTANCE_STORAGE_KEY = `datenight:legal-acceptance:v${LEGAL_ACCEPTANCE_VERSION}`;

type LegalAcceptanceRecord = {
  acceptedAt: number;
  privacyAcceptedAt: number;
  termsAcceptedAt: number;
  version: number;
};

interface LegalContextType {
  hasScrolledTerms: boolean;
  setHasScrolledTerms: (value: boolean) => void;
  hasScrolledPrivacy: boolean;
  setHasScrolledPrivacy: (value: boolean) => void;
  hasAcceptedLegal: boolean;
  legalAcceptanceLoading: boolean;
  acceptLegalDocuments: () => Promise<void>;
}

const LegalContext = createContext<LegalContextType | undefined>(undefined);

function buildAcceptanceRecord(acceptedAt = Date.now()): LegalAcceptanceRecord {
  return {
    acceptedAt,
    privacyAcceptedAt: acceptedAt,
    termsAcceptedAt: acceptedAt,
    version: LEGAL_ACCEPTANCE_VERSION,
  };
}

function readLocalAcceptance(): LegalAcceptanceRecord | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LegalAcceptanceRecord>;
    if (
      parsed.version !== LEGAL_ACCEPTANCE_VERSION ||
      typeof parsed.acceptedAt !== 'number' ||
      typeof parsed.privacyAcceptedAt !== 'number' ||
      typeof parsed.termsAcceptedAt !== 'number'
    ) {
      return null;
    }

    return parsed as LegalAcceptanceRecord;
  } catch {
    return null;
  }
}

function writeLocalAcceptance(record: LegalAcceptanceRecord) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LEGAL_ACCEPTANCE_STORAGE_KEY, JSON.stringify(record));
}

export const LegalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [legalAcceptanceLoading, setLegalAcceptanceLoading] = useState(true);

  useEffect(() => {
    const localAcceptance = readLocalAcceptance();
    if (localAcceptance) {
      setHasAcceptedLegal(true);
      setHasScrolledTerms(true);
      setHasScrolledPrivacy(true);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncAcceptance = async () => {
      if (authLoading) {
        return;
      }

      const localAcceptance = readLocalAcceptance();

      if (!user) {
        if (!isMounted) {
          return;
        }

        setHasAcceptedLegal(Boolean(localAcceptance));
        if (localAcceptance) {
          setHasScrolledTerms(true);
          setHasScrolledPrivacy(true);
        }
        setLegalAcceptanceLoading(false);
        return;
      }

      try {
        const { auth, rtdb } = await ensureFirebaseInitialized();
        const userId = user.uid || auth?.currentUser?.uid;

        if (!rtdb || !userId) {
          if (isMounted) {
            setHasAcceptedLegal(Boolean(localAcceptance));
            setLegalAcceptanceLoading(false);
          }
          return;
        }

        const acceptanceRef = ref(rtdb, `users/${userId}/profile/legalAcceptance`);
        const acceptanceSnapshot = await get(acceptanceRef);

        if (!isMounted) {
          return;
        }

        if (acceptanceSnapshot.exists()) {
          const remoteAcceptance = acceptanceSnapshot.val() as Partial<LegalAcceptanceRecord>;
          const acceptedAt = typeof remoteAcceptance.acceptedAt === 'number' ? remoteAcceptance.acceptedAt : Date.now();
          writeLocalAcceptance(buildAcceptanceRecord(acceptedAt));
          setHasAcceptedLegal(true);
          setHasScrolledTerms(true);
          setHasScrolledPrivacy(true);
        } else if (localAcceptance) {
          await set(acceptanceRef, localAcceptance);
          setHasAcceptedLegal(true);
          setHasScrolledTerms(true);
          setHasScrolledPrivacy(true);
        } else {
          setHasAcceptedLegal(false);
        }
      } catch (error) {
        console.error('Failed to sync legal acceptance', error);
        if (isMounted) {
          setHasAcceptedLegal(Boolean(localAcceptance));
        }
      } finally {
        if (isMounted) {
          setLegalAcceptanceLoading(false);
        }
      }
    };

    void syncAcceptance();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  const acceptLegalDocuments = async () => {
    const acceptanceRecord = buildAcceptanceRecord();
    writeLocalAcceptance(acceptanceRecord);
    setHasAcceptedLegal(true);
    setHasScrolledTerms(true);
    setHasScrolledPrivacy(true);

    try {
      const { auth, rtdb } = await ensureFirebaseInitialized();
      const userId = user?.uid || auth?.currentUser?.uid;

      if (rtdb && userId) {
        await set(ref(rtdb, `users/${userId}/profile/legalAcceptance`), acceptanceRecord);
      }
    } catch (error) {
      console.error('Failed to persist legal acceptance', error);
    }
  };

  return (
    <LegalContext.Provider
      value={{
        hasScrolledTerms,
        setHasScrolledTerms,
        hasScrolledPrivacy,
        setHasScrolledPrivacy,
        hasAcceptedLegal,
        legalAcceptanceLoading,
        acceptLegalDocuments,
      }}
    >
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
