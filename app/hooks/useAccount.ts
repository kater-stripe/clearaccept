import {useEffect, useState} from 'react';

import type {AccountInterface} from '@/types/account';
import fetchClient from '../utils/fetchClient';

export const useAccount = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountInstance, setAccountInstance] =
    useState<AccountInterface | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {data} = await fetchClient.get('/api/account');
        const account = data as AccountInterface;
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
