'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDemoConfig } from './DemoConfigContext';
import { useLocalStorage } from 'usehooks-ts';
import type { DemoMerchant } from '@/types/demoMerchant';
import { DEFAULT_DEMO_MERCHANT } from '@/constants/demoMerchant';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { ConnectComponentsProvider } from '@stripe/react-connect-js';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { getAccountByEmail as getAccountByEmailAction } from '@/app/api/accounts/getAccountByEmail';
import { createAccount as createAccountAction } from '@/app/api/accounts/createAccount';
import { getAccountById as getAccountByIdAction } from '@/app/api/accounts/getAccountById';
import type {
  CreateAccountSessionRequestBody,
  CreateAccountSessionResponse,
} from '@/app/api/accounts/account-session/route';
import { get } from 'lodash';

const DemoMerchantContext = createContext<
  | (DemoMerchant & {
      updateMerchant: <T extends keyof DemoMerchant>(
        key: T,
        value: DemoMerchant[T],
      ) => void;
      isSignedIn: boolean;
      signOut: () => void;
      createAccount: (
        params: Parameters<typeof createAccountAction>[0],
      ) => ReturnType<typeof createAccountAction>;
      isCreatingAccount: boolean;
      createAccountError: Error | null;
      getAccountByEmail: (
        params: Parameters<typeof getAccountByEmailAction>[0],
      ) => ReturnType<typeof getAccountByEmailAction>;
      isGettingAccountByEmail: boolean;
      getAccountByEmailError: Error | null;
      isCapabilityActive: (capabilityPath: string) => boolean;
      isCapitalEligible: boolean;
    })
  | null
>(null);

export const DemoMerchantProvider = ({ children }: PropsWithChildren) => {
  const { demoName, language, primaryColor } = useDemoConfig();
  const router = useRouter();
  const pathname = usePathname();

  const { accountId: accountIdFromParams } = useParams<{
    accountId?: string;
  }>();

  const demoMerchantName = useMemo(() => {
    return `${demoName}-${accountIdFromParams ? `storefront-${accountIdFromParams}-` : ''}demo-merchant`;
  }, [accountIdFromParams]);

  const [demoMerchant, setDemoMerchant] = useLocalStorage<DemoMerchant>(
    demoMerchantName,
    DEFAULT_DEMO_MERCHANT,
  );

  const updateMerchant = useCallback(
    <T extends keyof DemoMerchant>(key: T, value: DemoMerchant[T]) => {
      setDemoMerchant((previousMerchant) => ({
        ...previousMerchant,
        [key]: value,
      }));
    },
    [setDemoMerchant],
  );

  const signOut = useCallback(() => {
    setDemoMerchant(DEFAULT_DEMO_MERCHANT);

    router.push(`/${language}`);
  }, [setDemoMerchant]);

  const {
    mutateAsync: getAccountByEmail,
    isPending: isGettingAccountByEmail,
    error: getAccountByEmailError,
  } = useMutation({
    mutationFn: getAccountByEmailAction,
    onSuccess: (accountOrErrorMessage, { email }) => {
      if ('message' in accountOrErrorMessage) {
        throw new Error(accountOrErrorMessage.message);
      }

      setDemoMerchant((previousMerchant) => ({
        ...previousMerchant,
        account: accountOrErrorMessage,
        email,
      }));
    },
  });

  const { mutateAsync: getAccountById, isPending: isGettingAccountById } =
    useMutation({
      mutationFn: getAccountByIdAction,
      onSuccess: (accountOrErrorMessage) => {
        if ('message' in accountOrErrorMessage) {
          throw new Error(accountOrErrorMessage.message);
        }

        const email =
          accountOrErrorMessage.object === 'v2.core.account'
            ? accountOrErrorMessage.contact_email
            : accountOrErrorMessage.email;

        setDemoMerchant((previousMerchant) => ({
          ...previousMerchant,
          account: accountOrErrorMessage,
          email,
        }));
      },
    });

  const isSignedIn = !!demoMerchant.account;

  const [waitingForInitialRedirects, setWaitingForInitialRedirects] =
    useState(true);

  /**
   * If we're signed in and have an account, we should attempt to get the account by email to retrieve the latest account data.
   * Depending on the shape of the account data, we may want to redirect to the dashboard or home page.
   */
  useEffect(() => {
    const pathnameWithoutLanguage = pathname.replace(`/${language}`, '');

    if (!isSignedIn && !accountIdFromParams) {
      /**
       * If we're not signed in and on the dashboard somehow, redirect back to the home page.
       */
      if (pathnameWithoutLanguage.startsWith('/dashboard')) {
        router.push(`/${language}`);
      }

      setWaitingForInitialRedirects(false);

      return;
    }

    const updateAccount = async () => {
      const response = accountIdFromParams
        ? await getAccountById({
            id: accountIdFromParams,
            stripeSecretKey,
          })
        : await getAccountByEmail({
            email:
              demoMerchant.account!.object === 'v2.core.account'
                ? demoMerchant.account!.contact_email!
                : demoMerchant.account!.email!,
            stripeSecretKey,
          });

      /**
       * If we get signed out mid-update (due to resetting settings or something else), we shouldn't continue with the account update.
       */
      if (!isSignedIn) {
        setWaitingForInitialRedirects(false);

        return;
      }

      if ('message' in response) {
        setWaitingForInitialRedirects(false);

        return;
      }

      const account = response;

      // If we're on a dashboard page.
      if (pathnameWithoutLanguage.startsWith('/dashboard')) {
        /*
         * If we don't have account details submitted (meaning onboarding wasn't completed)
         * redirect back to the home page to show either embedded/hosted Connect onboarding.
         */
        if (account.object === 'v2.core.account') {
          if (
            account.requirements?.summary?.minimum_deadline?.status ===
            'past_due'
          ) {
            router.push(`/${language}`);
          }
        } else {
          if (!account.details_submitted) {
            router.push(`/${language}`);
          }
        }
      } else if (!pathnameWithoutLanguage.startsWith('/storefront')) {
        // If we're anywhere else in the application besides the storefront.

        /**
         * If we have an account, the account details were submitted (meaning onboarding was completed)
         * and we're not in the dashboard, redirect to the dashboard.
         */
        if (account.object === 'v2.core.account') {
          if (
            account.requirements?.summary?.minimum_deadline?.status !==
            'past_due'
          ) {
            router.push(`/${language}/dashboard`);
          }
        } else {
          if (account.details_submitted) {
            router.push(`/${language}/dashboard`);
          }
        }
      }

      setWaitingForInitialRedirects(false);
    };

    updateAccount();
  }, [isSignedIn]);
  const {
    mutateAsync: createAccount,
    isPending: isCreatingAccount,
    error: createAccountError,
  } = useMutation({
    mutationFn: createAccountAction,
    onSuccess: (accountOrErrorMessage) => {
      if ('message' in accountOrErrorMessage) {
        throw new Error(accountOrErrorMessage.message);
      }

      setDemoMerchant((previousMerchant) => ({
        ...previousMerchant,
        account: accountOrErrorMessage,
      }));
    },
  });

  const { stripeSecretKey, stripePublishableKey } = useDemoConfig();

  const connectInstance = useMemo(() => {
    if (!demoMerchant.account) {
      return null;
    }

    return loadConnectAndInitialize({
      publishableKey: stripePublishableKey as string,
      fetchClientSecret: async () => {
        const response = await fetch('/api/accounts/account-session', {
          method: 'POST',
          body: JSON.stringify({
            accountId: demoMerchant.account!.id,
            stripeSecretKey,
          } satisfies CreateAccountSessionRequestBody),
        });

        const { client_secret } =
          (await response.json()) as CreateAccountSessionResponse;

        return client_secret;
      },
      appearance: {
        variables: {
          colorPrimary: primaryColor,
          fontFamily: 'Sohne, -apple-system, BlinkMacSystemFont, sans-serif',
        },
      },
      locale:
        language === 'en-GB'
          ? language
          : `${language}-${(demoMerchant.account.object === 'account' ? demoMerchant.account.country : demoMerchant.account.identity?.country) ?? 'US'}`,
    });
  }, [demoMerchant.account]);

  const isCapitalEligible = useMemo(() => {
    const account = demoMerchant.account;

    if (!account) {
      return false;
    }

    return ['US', 'FR', 'GB'].includes(
      (account.object === 'account'
        ? account.country
        : account.identity?.country) ?? '',
    );
  }, [demoMerchant.account]);

  /**
   * If we're signed in but don't yet have a Connect instance, we should wait for one to be created.
   */
  if (
    (isSignedIn && !connectInstance) ||
    isGettingAccountById ||
    waitingForInitialRedirects
  ) {
    return <LoadingOverlay />;
  }

  const isCapabilityActive = (capabilityPath: string) => {
    const account = demoMerchant.account;

    if (!account) {
      return false;
    }

    if (account?.object === 'v2.core.account') {
      const capabilities = account.configuration?.merchant?.capabilities;

      const capabilityObject = get(capabilities, capabilityPath);

      return capabilityObject?.status === 'active';
    }

    const capabilities = account.capabilities;

    const capabilityObject = get(capabilities, capabilityPath);

    return capabilityObject === 'active';
  };

  const demoMerchantContext = {
    ...demoMerchant,
    updateMerchant,
    isSignedIn,
    signOut,
    createAccount,
    isCreatingAccount,
    createAccountError,
    getAccountByEmail,
    isGettingAccountByEmail,
    getAccountByEmailError,
    isCapabilityActive,
    isCapitalEligible,
  };

  /**
   * If Connect is initialized, we should render the children within the `ConnectComponentsProvider`, enabling us to use
   * Connect's embedded components anywhere in the app!
   */
  if (connectInstance) {
    return (
      <ConnectComponentsProvider connectInstance={connectInstance}>
        <DemoMerchantContext.Provider value={demoMerchantContext}>
          {children}
        </DemoMerchantContext.Provider>
      </ConnectComponentsProvider>
    );
  }

  return (
    <DemoMerchantContext.Provider value={demoMerchantContext}>
      {children}
    </DemoMerchantContext.Provider>
  );
};

export const useDemoMerchant = () => {
  const context = useContext(DemoMerchantContext);

  if (!context) {
    throw new Error(
      '`useDemoMerchant` must be used within a `DemoMerchantProvider`',
    );
  }

  return context;
};
