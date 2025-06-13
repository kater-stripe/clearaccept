'use client';

import {createContext, useContext, useEffect, useState} from 'react';

import type {AccountInterface} from '@/types/account';
import fetchClient from '../utils/fetchClient';
import {useSession} from 'next-auth/react';

type AccountContextType = {
  account: AccountInterface | null;
  loading: boolean;
  error: any;
};

export const AccountContext = createContext<AccountContextType>({
  account: null,
  loading: true,
  error: null,
});

export const AccountProvider = ({children}: {children: React.ReactNode}) => {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState<AccountInterface | null>(null);

  useEffect(() => {
    if (session.status !== 'authenticated') {
      return;
    }

    const fetchAccount = async () => {
      setLoading(true);
      try {
        const {data} = await fetchClient.get('/api/account');

        const account = data as AccountInterface;

        setAccount(account);
      } catch (error: any) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [session.status]);

  return (
    <AccountContext.Provider value={{account, loading, error}}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);

  if (context === undefined) {
    throw new Error('`useAccount` must be used within an `AccountProvider`');
  }

  return context;
};
