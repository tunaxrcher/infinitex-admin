'use client';

import { useState } from 'react';
import { LoanDetailsView } from './loan-details-view';
import { PinEntryScreen } from './pin-entry-screen';

interface LoanCheckPageProps {
  loanApplicationId: string;
}

export function LoanCheckPage({ loanApplicationId }: LoanCheckPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const handlePinSuccess = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <PinEntryScreen onSuccess={handlePinSuccess} />;
  }

  return (
    <LoanDetailsView
      loanApplicationId={loanApplicationId}
      authToken={authToken!}
    />
  );
}
