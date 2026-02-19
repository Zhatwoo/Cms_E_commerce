'use client';

import { useState, useRef } from 'react';
import { LandingHeader } from './components/header';
import { AuthModal } from './components/authModal';
import { LandingScrollRoot } from './components/scrolling';

type AuthMode = 'login' | 'register';

export function LandingPageClient({ children }: { children: React.ReactNode }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleAuthClick = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <LandingScrollRoot
        headerSlot={<LandingHeader onAuthClick={handleAuthClick} />}
      >
        {children}
      </LandingScrollRoot>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
