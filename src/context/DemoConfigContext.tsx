'use client';

import { BrandColorOverrides } from '@/components/demoConfig/BrandColorOverrides';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { DEFAULT_DEMO_CONFIG } from '@/constants/demoConfig';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import i18n from '@/i18n';
import type { DemoConfig } from '@/types/demoConfig';
import { parseJsonWithFallback } from '@/utils/parseJsonWithFallback';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useLocalStorage } from 'usehooks-ts';
import type { CountryCode } from '@/constants/countryCodes';
import { useUmami } from './UmamiContext';
import { useDebounceValue } from '@/hooks/useDebounceValue';
import { getPlatformAccount } from '@/app/api/accounts/getPlatformAccount';
import { getDemoConfigFromServer } from '@/app/api/demo/getDemoConfigFromServer';
import { getIsUsingCustomKeys } from '@/app/api/demo/getIsUsingCustomKeys';

const DemoConfigContext = createContext<
  DemoConfig & {
    configure: <T extends keyof DemoConfig>(
      key: T,
      value: DemoConfig[T],
    ) => void;
    resetDemoConfig: () => void;
    canCreateObjects: boolean;
  }
>({
  ...DEFAULT_DEMO_CONFIG,
  configure: () => {},
  resetDemoConfig: () => {},
  canCreateObjects: false,
});

export const DemoConfigProvider = ({ children }: PropsWithChildren) => {
  const [demoConfig, setDemoConfig] = useLocalStorage<
    Partial<DemoConfig> | undefined
  >(`${DEFAULT_DEMO_CONFIG.demoName}-custom-demo-config`, undefined);

  const [initialized, setInitialized] = useDebounceValue(false, 50);

  useEffect(() => {
    if (demoConfig !== undefined) {
      return;
    }

    setInitialized(false);
  }, [demoConfig]);

  const searchParams = useSearchParams();

  const demoConfigInSearchParams = useMemo<Partial<DemoConfig>>(() => {
    const demoConfigInSearchParams = new Map<keyof DemoConfig, string>();

    searchParams.forEach((value, key) => {
      const lowercaseKey = key.toLowerCase();

      if (!lowercaseKey.startsWith('demogen_')) {
        return;
      }

      if (lowercaseKey.includes('color')) {
        value = `#${value}`;
      }

      const demoConfigKey = key.replace(/demogen_/g, '');

      if (!Object.keys(DEFAULT_DEMO_CONFIG).includes(demoConfigKey)) {
        console.error(
          `The demogen search parameter \`${key}\` was provided, though the demo configuration key \`${demoConfigKey}\` wasn\'t recognized. Ignoring.`,
        );
        return;
      }

      demoConfigInSearchParams.set(
        demoConfigKey as keyof DemoConfig,
        parseJsonWithFallback(value),
      );
    });

    return Object.fromEntries(demoConfigInSearchParams.entries());
  }, [searchParams]);

  const { language } = useParams<{
    language?: string;
  }>();

  const changeLanguage = (language: DemoConfig['language']) => {
    i18n.changeLanguage(language);

    const pathname = window.location.pathname;
    const newPath = pathname.replace(/^\/[^/]+/, `/${language}`);

    const search = window.location.search;
    const hash = window.location.hash;

    window.history.replaceState({}, '', newPath + search + hash);
  };

  useEffect(() => {
    if (language === undefined) {
      return;
    }

    if (
      !SUPPORTED_LANGUAGES.some(
        (supportedLanguage) => supportedLanguage === language,
      )
    ) {
      return;
    }

    configure('language', language as DemoConfig['language']);
  }, [language]);

  const { data: account } = useQuery({
    queryKey: ['account', demoConfig?.stripeSecretKey],
    queryFn: () =>
      getPlatformAccount({
        stripeSecretKey: demoConfig?.stripeSecretKey,
      }),
    placeholderData: (previousAccount) => previousAccount,
    retry: false,
  });

  const { data: demoConfigFromServer } = useQuery({
    queryKey: ['demoConfigFromServer'],
    queryFn: () => getDemoConfigFromServer(),
  });

  useEffect(() => {
    if (!demoConfigFromServer) {
      return;
    }

    const {
      primaryColor,
      secondaryColor,
      customLogo,
      customHero,
      ...demoConfigWithoutPersonalizedValues
    } = demoConfig ?? {};

    const newDemoConfig = {
      ...DEFAULT_DEMO_CONFIG,
      ...demoConfigFromServer,
      ...demoConfigWithoutPersonalizedValues,
      country: (account?.country?.toUpperCase() as CountryCode) ?? 'US',
    };

    setInitialized(true);

    setDemoConfig(newDemoConfig);
    changeLanguage(newDemoConfig.language);
  }, [account, initialized, demoConfigFromServer]);

  const { debounceTrack } = useUmami();

  const configure = useCallback(
    <T extends keyof DemoConfig>(key: T, value: DemoConfig[T]) => {
      setDemoConfig((previousDemoConfig) => {
        const newDemoConfigInLocalStorage = {
          ...previousDemoConfig,
        };

        newDemoConfigInLocalStorage[key] = value;

        if (key === 'language') {
          changeLanguage(value as DemoConfig['language']);
        }

        if (key === 'stripePublishableKey' || key === 'stripeSecretKey') {
          debounceTrack('settings_changed', {
            settings_type: 'stripe_keys',
            stripe_keys_change_value: 'custom',
          });
        } else {
          debounceTrack('settings_changed', {
            setting_type: key,
            [`${key}_change_value`]: value,
          });
        }

        return newDemoConfigInLocalStorage;
      });
    },
    [setDemoConfig, debounceTrack],
  );

  useEffect(() => {
    (async () => {
      const isUsingCustomKeys = await getIsUsingCustomKeys({
        stripeSecretKey: demoConfig?.stripeSecretKey,
        stripePublishableKey: demoConfig?.stripePublishableKey,
      });

      debounceTrack('page_state', {
        currency_value: demoConfig?.currency,
        language_value: demoConfig?.language,
        primaryColor_value: demoConfig?.primaryColor,
        secondaryColor_value: demoConfig?.secondaryColor,
        stripePublishableKey_value: demoConfig?.stripePublishableKey,
        stripe_keys_value: isUsingCustomKeys ? 'custom' : 'default',
        customLogo_value: demoConfig?.customLogo,
        customHero_value: demoConfig?.customHero,
      });
    })();
  }, [
    demoConfig?.currency,
    demoConfig?.language,
    demoConfig?.primaryColor,
    demoConfig?.secondaryColor,
    demoConfig?.stripePublishableKey,
    demoConfig?.stripeSecretKey,
    demoConfig?.customLogo,
    demoConfig?.customHero,
  ]);

  const resetDemoConfig = () => {
    const newDemoConfig = {
      /**
       * The order of precedence for demo configuration.
       * Items listed first have the least precedence.
       *
       * Note, it's probably a good idea to list search parameters last (most precedence) as a user may have
       * previously configured the demo, meaning a local storage entry could exist and conflict with
       * demo gen in the Demo Hub.
       */
      ...DEFAULT_DEMO_CONFIG,
      ...demoConfigFromServer,
      country: (account?.country?.toUpperCase() as CountryCode) ?? 'US',
    };

    setDemoConfig(newDemoConfig);

    changeLanguage(newDemoConfig.language);
  };

  const { data: isUsingCustomKeys } = useQuery({
    queryKey: [
      'isUsingCustomKeys',
      demoConfig?.stripeSecretKey,
      demoConfig?.stripePublishableKey,
    ],
    queryFn: () =>
      getIsUsingCustomKeys({
        stripeSecretKey: demoConfig?.stripeSecretKey,
        stripePublishableKey: demoConfig?.stripePublishableKey,
      }),
  });

  const canCreateObjects =
    !!isUsingCustomKeys || demoConfig?.chargeType === 'direct';

  if (!initialized || !demoConfig) {
    return (
      <>
        <BrandColorOverrides />
        <LoadingOverlay />
      </>
    );
  }

  return (
    <DemoConfigContext.Provider
      value={{
        ...(demoConfig as DemoConfig),
        ...demoConfigInSearchParams,
        configure,
        resetDemoConfig,
        canCreateObjects,
      }}
    >
      <BrandColorOverrides />
      {children}
    </DemoConfigContext.Provider>
  );
};

export const useDemoConfig = () => useContext(DemoConfigContext);
