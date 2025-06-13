import {useEffect, useState} from 'react';

import type {AccountInterface} from '@/types/account';
import fetchClient from '../utils/fetchClient';
import {useSession} from 'next-auth/react';

export const useAccount = () => {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountInstance, setAccountInstance] =
    useState<AccountInterface | null>(null);

  useEffect(() => {
    if (session.status !== 'authenticated') {
      return;
    }

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
  }, [session.status]);

  return {
    error,
    loading,
    account: accountInstance,
  };
};
