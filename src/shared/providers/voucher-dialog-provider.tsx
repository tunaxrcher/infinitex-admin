'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { VoucherDialog } from '@src/features/documents/components';

interface VoucherDialogContextType {
  openReceiptVoucher: () => void;
  openPaymentVoucher: () => void;
  closeVoucherDialog: () => void;
}

const VoucherDialogContext = createContext<VoucherDialogContextType | undefined>(undefined);

export function useVoucherDialog() {
  const context = useContext(VoucherDialogContext);
  if (!context) {
    throw new Error('useVoucherDialog must be used within VoucherDialogProvider');
  }
  return context;
}

export function VoucherDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'receipt' | 'payment'>('receipt');

  const openReceiptVoucher = useCallback(() => {
    setDefaultTab('receipt');
    setIsOpen(true);
  }, []);

  const openPaymentVoucher = useCallback(() => {
    setDefaultTab('payment');
    setIsOpen(true);
  }, []);

  const closeVoucherDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <VoucherDialogContext.Provider
      value={{
        openReceiptVoucher,
        openPaymentVoucher,
        closeVoucherDialog,
      }}
    >
      {children}
      <VoucherDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        defaultTab={defaultTab}
      />
    </VoucherDialogContext.Provider>
  );
}

