import {useEffect, useState} from 'react';

import type {AccountInterface} from '@/types/account';

export const useAccount = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountInstance, setAccountInstance] =
    useState<AccountInterface | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/account');
        const account = (await response.json()) as AccountInterface;
        setAccountInstance(account);
        setLoading(false);
      } catch (error: any) {
        setError(error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return {
    error,
    loading,
    account: accountInstance,
  };
};
