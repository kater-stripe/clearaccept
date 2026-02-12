'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import type { FakeBill } from '@/types/fakeBill';
import { createDefaultBills, getBillsStorageKey } from '@/utils/bills';

export const useFakeBills = () => {
  const { demoName, currency } = useDemoConfig();
  const { account } = useDemoMerchant();
  const initializedRef = useRef(false);

  const storageKey = account
    ? getBillsStorageKey(demoName, account.id)
    : `${demoName}-bills-temp`;

  const [bills, setBills] = useLocalStorage<FakeBill[]>(storageKey, []);

  // Initialize bills on first load if empty
  useEffect(() => {
    if (!account || initializedRef.current || bills.length > 0) {
      return;
    }

    initializedRef.current = true;
    const defaultBills = createDefaultBills(currency);
    setBills(defaultBills);
  }, [account, bills.length, currency, setBills]);

  const markBillAsPaid = useCallback(
    (billId: string) => {
      setBills((prevBills) =>
        prevBills.map((bill) =>
          bill.id === billId ? { ...bill, status: 'paid' as const } : bill,
        ),
      );
    },
    [setBills],
  );

  const getBillById = useCallback(
    (billId: string): FakeBill | undefined => {
      return bills.find((bill) => bill.id === billId);
    },
    [bills],
  );

  return {
    bills,
    setBills,
    markBillAsPaid,
    getBillById,
  };
};
