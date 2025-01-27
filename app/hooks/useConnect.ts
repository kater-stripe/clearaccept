import {useEffect, useMemo, useState, useCallback} from 'react';
import {type StripeConnectInstance} from '@stripe/connect-js';
import {loadConnectAndInitialize} from '@stripe/connect-js';
import {useSettings} from '@/app/hooks/useSettings';
import type {LocaleType} from '@/types/settings';
import {useConfigContext} from '../contexts/ConfigContext';
import {convertToLocale} from '../utils/helpers';
import fetchClient from '../utils/fetchClient';

export const useConnect = (demoOnboarding: boolean) => {
  const [hasError, setHasError] = useState(false);
  const [stripeConnectInstance, setStripeConnectInstance] =
    useState<StripeConnectInstance | null>(null);

  // const settings = useSettings();
  const {settings} = useConfigContext();
  const locale = convertToLocale(settings?.language || 'en');

  const [localLocale, setLocalLocale] = useState(locale);

  useEffect(() => {
    if (locale === localLocale) {
      return;
    }

    let newAccountSessionRequired: boolean = false;

    switch (locale) {
      case 'fr-FR':
        newAccountSessionRequired = true;
        break;
      case 'en-GB':
        newAccountSessionRequired = true;
        break;
      case 'en-SG':
      case 'en-HK':
      case 'zh-Hant-HK':
        if (localLocale === 'zh-Hant-HK' || localLocale === 'en-HK') {
          // No need to get a new account session here
        } else {
          newAccountSessionRequired = true;
        }
        break;
      default:
        if (
          ['fr-FR', 'en-SG', 'en-HK', 'zh-Hant-HK', 'en-GB'].includes(
            localLocale
          )
        ) {
          // We need a new account session
          newAccountSessionRequired = true;
        }

        break;
    }

    if (locale !== localLocale) {
      setLocalLocale(locale);
    }

    if (demoOnboarding && newAccountSessionRequired) {
      setStripeConnectInstance(null);
    }
  }, [locale, localLocale, demoOnboarding]);

  const fetchClientSecret = useCallback(async () => {
    if (demoOnboarding) {
      console.log('Fetching client secret for demo onboarding');
    }
    const onboardingData = demoOnboarding
      ? {
          demoOnboarding: true,
          locale,
        }
      : {};

    // Fetch the AccountSession client secret
    const {data} = await fetchClient.post(
      '/api/account_session',
      onboardingData
    );
    if (!data.client_secret) {
      setHasError(true);
      return undefined;
    }

    setHasError(false);
    return data.client_secret;
  }, [demoOnboarding, locale]);

  const appearanceVariables = useMemo(
    () => ({
      fontFamily: 'Sohne, inherit',

      colorPrimary: '#312356',

      buttonPrimaryColorBackground: '#312356',
      buttonPrimaryColorText: '#f4f4f5',

      badgeSuccessColorBackground: '#D7F4CC',
      badgeSuccessColorText: '#264F47',
      badgeSuccessColorBorder: '#BDDAB3',

      badgeWarningColorBackground: '#FFEACC',
      badgeWarningColorText: '#C95B4D',
      badgeWarningColorBorder: '#FFD28C',

      badgeDangerColorBackground: '#FFEACC',
      badgeDangerColorText: '#C95B4D',
      badgeDangerColorBorder: '#FFD28C',
    }),
    []
  );

  useEffect(() => {
    // If we are demoing onboarding, re-init to get a new secret
    if (stripeConnectInstance) {
      stripeConnectInstance.update({
        appearance: {
          overlays: 'dialog',
          variables: appearanceVariables,
        },
        locale: locale,
      });
    } else {
      const instance = loadConnectAndInitialize({
        publishableKey: settings?.stripePublishableKey,
        appearance: {
          overlays: 'dialog',
          variables: appearanceVariables,
        },
        locale: locale,
        fetchClientSecret: async () => {
          return await fetchClientSecret();
        },
        metaOptions: {
          flagOverrides: {
            // Hide testmode stuff
            enable_sessions_demo: true,
          },
        },
      } as any);

      setStripeConnectInstance(instance);
    }
  }, [
    stripeConnectInstance,
    locale,
    fetchClientSecret,
    demoOnboarding,
    appearanceVariables,
  ]);

  return {
    hasError,
    stripeConnectInstance,
  };
};
