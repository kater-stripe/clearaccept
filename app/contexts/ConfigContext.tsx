'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  PropsWithChildren,
} from 'react';
import i18n from '@/app/i18n';
import {defaultDemoSettings, supportedLanguages} from '@/app/config/config';
import {extractLocale, generateRandomCustomerEmail} from '@/app/utils/helpers';
import {loadFromStorage, saveToStorage} from '@/app/utils/clientStorage';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import {getEnv} from '@/app/config/customizationConfig';
import {useSearchParams} from 'next/navigation';
import {debounceTrack} from '@/app/utils/tracking';
import {signOut} from 'next-auth/react';

interface Settings {
  language: string;
  [key: string]: any;
}

interface Customer {
  id: string;
  email: string;
  [key: string]: any;
}

interface State {
  settings: Settings | null;
  customer: Customer | null;
  isLoading: boolean;
  isToolsPanelOpen: boolean;
  refreshElements: number;
}

interface ConfigContextType extends State {
  updateSetting: (key: string, value: any) => void;
  updateCustomer: (newCustomer: Partial<Customer>) => void;
  updateState: (newState: Partial<State>) => void;
  triggerElementsRefresh: () => void;
  toggleToolsPanel: (panelName: string) => void;
  resetSettings: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const toggleToolsPanel = (state: State, panelName: string): State => ({
  ...state,
  [panelName]: !state[panelName as keyof State],
});

const resetSettings = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }

  window.location.href = '/default';
};

export function ConfigProvider({children}: PropsWithChildren<unknown>) {
  const [state, setState] = useState<State>({
    settings: null,
    customer: null,
    isLoading: true,
    isToolsPanelOpen: false,
    refreshElements: 0,
  });
  const searchParams = useSearchParams();

  const updateState = useCallback((newState: Partial<State>) => {
    setState((prevState) => {
      const updatedState = {...prevState, ...newState};

      ['settings', 'customer'].forEach((key) => {
        if (newState[key as keyof State]) {
          try {
            if (!searchParams.toString().includes('demogen_')) {
              saveToStorage(key, updatedState[key as keyof State]);
            }
          } catch (error) {
            console.error(`Failed to save ${key} to storage:`, error);
          }
        }
      });

      return updatedState;
    });
  }, []);

  useEffect(() => {
    const loadInitialState = () => {
      try {
        getEnv().then((env) => {
          let locale = extractLocale(window.location.href);

          // Search param overrides
          const params: {[anyProp: string]: string} = {};
          searchParams.forEach((value, key) => {
            if (!key.toLowerCase().includes('demogen_')) {
              return;
            }

            if (key.toLowerCase().includes('color')) {
              value = `#${value}`;
            }

            params[key.replace(/demogen_/g, '')] = value;
          });

          // Handle default locale
          if (locale === 'default') {
            const defaultLanguage =
              loadFromStorage('settings', {})?.language || env.language;
            window.location.replace(`/${defaultLanguage}`);
            locale = defaultLanguage;
          }

          const settings = {
            ...defaultDemoSettings,
            ...env,
            ...loadFromStorage('settings', {...defaultDemoSettings, ...env}),
            ...(locale ? {language: locale} : {}),
            ...params,
          };

          // Title replacement
          if (env.isDemogen) {
            document.title = 'Stripe Demo';
          }

          const customer = loadFromStorage('customer', {
            email: generateRandomCustomerEmail(),
          });

          updateState({
            settings,
            customer,
            isLoading: false,
          });
          i18n.changeLanguage(settings.language);
        });
      } catch (error) {
        console.error('Failed to load initial state:', error);
        updateState({isLoading: false});
      }
    };

    loadInitialState();
  }, [searchParams, updateState]);

  const updateSetting = useCallback(
    (key: string, value: any) => {
      updateState({
        settings: {...state.settings, [key]: value} as Settings,
      });

      // Track setting changes
      if (key === 'stripeSecretKey') {
        if (value?.startsWith('sk_')) {
          debounceTrack('setting_changed', {
            setting_type: 'stripe_keys',
            stripe_keys_change_value: 'custom',
          });
        }
      } else {
        debounceTrack('setting_changed', {
          setting_type: key,
          [`${key}_change_value`]: value,
        });
      }

      if (key === 'language' && supportedLanguages.includes(value)) {
        i18n.changeLanguage(value);
        window.history.pushState({}, '', `/${value}`);
      }
    },
    [state.settings, updateState]
  );

  const updateCustomer = useCallback(
    (newCustomer: Partial<Customer>) => {
      updateState({
        customer: {...state.customer, ...newCustomer} as Customer,
      });
    },
    [state, updateState]
  );

  const triggerElementsRefresh = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      refreshElements: prevState.refreshElements + 1,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      updateSetting,
      updateCustomer,
      updateState,
      triggerElementsRefresh,
      toggleToolsPanel: (panelName: string) =>
        setState((state) => {
          const newState = toggleToolsPanel(state, panelName);
          // @ts-expect-error umami exposed at load
          if (newState[panelName] === true) {
            debounceTrack('tools_panel_opened');
          }
          return newState;
        }),
      resetSettings,
    }),
    [state, updateSetting, updateCustomer, updateState, triggerElementsRefresh]
  );

  if (state.isLoading) return <LoadingOverlay />;

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfigContext(): ConfigContextType {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }

  return context;
}
