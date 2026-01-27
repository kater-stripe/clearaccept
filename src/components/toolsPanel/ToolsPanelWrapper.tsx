'use client';

import { type ReactNode } from 'react';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useCart } from '@/context/CartContext';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { generateRandomEmail } from '@/utils/generateRandomEmail';
import { CURRENCY_CODES } from '@/constants/currencyCodes';
import { DEFAULT_DEMO_CONFIG } from '@/constants/demoConfig';
import { ToolsPanelProvider } from '@demoeng/tools-panel';
import type { DemoConfig } from '@/types/demoConfig';
import type { DemoCustomer } from '@/types/demoCustomer';
import type { DemoMerchant } from '@/types/demoMerchant';

export const ToolsPanelWrapper = ({ children }: { children: ReactNode }) => {
  const { resetDemoConfig, configure, language, currency, checkoutMethod, elementsStyle, elementsExpressCheckoutEnabled, elementsAddressFormEnabled, cryptoEnabled, stripePublishableKey, stripeSecretKey, onboardingType, chargeType, useV2Accounts, treasuryCapabilityEnabled, onboardCollectionFields, capitalFinancingPromotionLayout } = useDemoConfig();
  const { clearCart } = useCart();
  const { signOut: signOutCustomer, updateCustomer, email: customerEmail } = useDemoCustomer();
  const { signOut: signOutMerchant, email: merchantEmail, updateMerchant, isSignedIn: isMerchantSignedIn } = useDemoMerchant();

  const onReset = () => {
    resetDemoConfig();
    clearCart();
    signOutCustomer();
    signOutMerchant();
    updateMerchant('email', generateRandomEmail());
    updateCustomer('email', generateRandomEmail());
  };

  return (
    <ToolsPanelProvider config={{
      apiActivity: {
        enabled: true,
      },
      demoConfig: {
        enabled: true,
        tabs: {
          integrationAndLocalization: {
            items: [
              {
                type: 'dropdown',
                label: 'Currency',
                options: CURRENCY_CODES.map((currency) => ({ label: currency.toUpperCase(), value: currency })),
                value: currency,
                onChange: (value) => {
                  configure('currency', value);
                }
              },
              {
                type: 'dropdown',
                label: 'Language',
                options: [
                  { label: 'English', value: 'en' },
                  { label: 'French', value: 'fr' },
                  { label: 'Spanish', value: 'es' },
                  { label: 'German', value: 'de' },
                  { label: 'Italian', value: 'it' },
                  { label: 'Japanese', value: 'ja' },
                  { label: 'Chinese (Simplified)', value: 'zh' },
                ] as const,
                value: language,
                onChange: (value: DemoConfig['language']) => {
                  configure('language', value);
                }
              },
              {
                type: 'dropdown',
                label: 'Checkout Integration',
                options: [
                  { label: 'Elements w/ PI', value: 'elements-checkout' },
                  { label: 'Stripe-hosted page', value: 'hosted-checkout' },
                  { label: 'Embedded form', value: 'embedded-checkout' },
                  { label: 'Elements w/ CS', value: 'elements-checkout-with-checkout-sessions' },
                ],
                value: checkoutMethod,
                onChange: (value: DemoConfig['checkoutMethod']) => {
                  configure('checkoutMethod', value);
                }
              },
              {
                type: 'text-input',
                label: 'Customer Email',
                value: customerEmail ?? '',
                onChange: (value: DemoCustomer['email']) => {
                  updateCustomer('email', value);
                }
              },
            ]
          },
          checkout: {
            items: [
              {
                type: 'dropdown',
                label: 'Elements Style',
                options: [
                  { label: 'Accordion', value: 'accordion' },
                  { label: 'Tabs', value: 'tabs' },
                ],
                value: elementsStyle,
                onChange: (value: DemoConfig['elementsStyle']) => {
                  configure('elementsStyle', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Express Checkout Element',
                value: elementsExpressCheckoutEnabled,
                onChange: (value: DemoConfig['elementsExpressCheckoutEnabled']) => {
                  configure('elementsExpressCheckoutEnabled', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Address Element',
                value: elementsAddressFormEnabled,
                onChange: (value: DemoConfig['elementsAddressFormEnabled']) => {
                  configure('elementsAddressFormEnabled', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Crypto Enabled',
                value: cryptoEnabled,
                onChange: (value: DemoConfig['cryptoEnabled']) => {
                  configure('cryptoEnabled', value);
                }
              }
            ],
          },
          apiKeysAndEnvironment: {
            items: [
              ...(isMerchantSignedIn ? [{
                type: 'alert' as const,
                message: 'You are signed in. To edit these settings, please sign out first.',
                content: [{
                  type: 'button' as const,
                  label: 'Sign Out',
                  onClick: () => {
                    signOutMerchant();
                  }
                }]
              }] : []),
              {
                type: 'text-input',
                label: 'Stripe Publishable Key',
                value: stripePublishableKey !== DEFAULT_DEMO_CONFIG.stripePublishableKey ? (stripePublishableKey ?? '') : '',
                onChange: (value: DemoConfig['stripePublishableKey']) => {
                  configure('stripePublishableKey', value || DEFAULT_DEMO_CONFIG.stripePublishableKey);
                },
                disabled: isMerchantSignedIn
              },
              {
                type: 'text-input',
                label: 'Stripe Secret Key',
                value: stripeSecretKey ?? '',
                onChange: (value: DemoConfig['stripeSecretKey']) => {
                  configure('stripeSecretKey', value || DEFAULT_DEMO_CONFIG.stripeSecretKey);
                },
                disabled: isMerchantSignedIn
              },
            ]
          },
          connect: {
            items: [
              {
                type: 'dropdown',
                label: 'Onboarding Type',
                options: [
                  { label: 'Hosted', value: 'hosted' },
                  { label: 'Embedded', value: 'embedded' },
                ],
                value: onboardingType,
                onChange: (value: DemoConfig['onboardingType']) => {
                  configure('onboardingType', value);
                }
              },
              {
                type: 'dropdown',
                label: 'Charge Type',
                options: [
                  { label: 'Direct', value: 'direct' },
                  { label: 'Destination', value: 'destination' },
                  { label: 'Destination (On Behalf Of)', value: 'destination-on-behalf-of' },
                ],
                value: chargeType,
                onChange: (value: DemoConfig['chargeType']) => {
                  configure('chargeType', value);
                }
              },
              ...(isMerchantSignedIn ? [{
                type: 'alert' as const,
                message: 'You are signed in. To change "Use V2 Accounts", please sign out first.',
                content: [{
                  type: 'button' as const,
                  label: 'Sign Out',
                  onClick: () => {
                    signOutMerchant();
                  }
                }]
              }] : []),
              {
                type: 'checkbox',
                label: 'Use V2 Accounts',
                value: useV2Accounts,
                disabled: isMerchantSignedIn,
                onChange: (value: DemoConfig['useV2Accounts']) => {
                  configure('useV2Accounts', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Onboard with Treasury',
                value: treasuryCapabilityEnabled ?? false,
                onChange: (value: DemoConfig['treasuryCapabilityEnabled']) => {
                  configure('treasuryCapabilityEnabled', value);
                }
              },
              {
                type: 'dropdown',
                label: 'Onboarding Collection Fields',
                options: [
                  { label: 'Eventually Due', value: 'eventually_due' },
                  { label: 'Currently Due', value: 'currently_due' },
                ],
                value: onboardCollectionFields,
                onChange: (value: DemoConfig['onboardCollectionFields']) => {
                  configure('onboardCollectionFields', value);
                }
              },
              {
                type: 'dropdown',
                label: 'Financing Promotion Layout',
                options: [
                  { label: 'Banner', value: 'banner' },
                  { label: 'Full', value: 'full' },
                ],
                value: capitalFinancingPromotionLayout ?? 'banner',
                onChange: (value: DemoConfig['capitalFinancingPromotionLayout']) => {
                  configure('capitalFinancingPromotionLayout', value);
                }
              },
              {
                type: 'text-input',
                label: 'Merchant Email',
                value: merchantEmail ?? '',
                onChange: (value: DemoMerchant['email']) => {
                  updateMerchant('email', value);
                }
              },
            ]
          },
          seedingAndTestHelpers: {
            items: []
          }
        },
        onReset,
      }
    }}>
      {children}
    </ToolsPanelProvider >
  );
};

