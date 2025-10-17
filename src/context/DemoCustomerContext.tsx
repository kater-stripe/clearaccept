'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useDemoConfig } from './DemoConfigContext';
import { useLocalStorage } from 'usehooks-ts';
import type { DemoCustomer } from '@/types/demoCustomer';
import { DEFAULT_DEMO_CUSTOMER } from '@/constants/demoCustomer';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from './CartContext';
import { useDemoMerchant } from './DemoMerchantContext';

const DemoCustomerContext = createContext<
  | (DemoCustomer & {
      updateCustomer: <T extends keyof DemoCustomer>(
        key: T,
        value: DemoCustomer[T],
      ) => void;
      isSignedIn: boolean;
      signOut: (redirect?: boolean) => void;
    })
  | null
>(null);

export const DemoCustomerProvider = ({ children }: PropsWithChildren) => {
  const { demoName, language } = useDemoConfig();
  const { clearCart } = useCart();
  const router = useRouter();

  const pathname = usePathname();

  const { account } = useDemoMerchant();

  const demoCustomerName = useMemo(() => {
    const dashboardOrStorefront = pathname.includes('/storefront/')
      ? 'storefront'
      : 'dashboard';

    return `${demoName}-${dashboardOrStorefront}-${account?.id}-demo-customer`;
  }, [pathname, account?.id]);

  const [demoCustomer, setDemoCustomer] = useLocalStorage<DemoCustomer>(
    demoCustomerName,
    DEFAULT_DEMO_CUSTOMER,
  );

  const updateCustomer = useCallback(
    <T extends keyof DemoCustomer>(key: T, value: DemoCustomer[T]) => {
      setDemoCustomer((previousCustomer) => ({
        ...previousCustomer,
        [key]: value,
      }));
    },
    [setDemoCustomer],
  );

  const isSignedIn = !!demoCustomer.id;

  const signOut = useCallback(
    (redirect?: boolean) => {
      setDemoCustomer(DEFAULT_DEMO_CUSTOMER);

      if (redirect) {
        router.push(`/${language}`);
      }

      clearCart();
    },
    [setDemoCustomer],
  );

  return (
    <DemoCustomerContext.Provider
      value={{
        ...demoCustomer,
        updateCustomer,
        isSignedIn,
        signOut,
      }}
    >
      {children}
    </DemoCustomerContext.Provider>
  );
};

export const useDemoCustomer = () => {
  const context = useContext(DemoCustomerContext);

  if (!context) {
    throw new Error(
      '`useDemoCustomer` must be used within a `DemoCustomerProvider`',
    );
  }

  return context;
};
