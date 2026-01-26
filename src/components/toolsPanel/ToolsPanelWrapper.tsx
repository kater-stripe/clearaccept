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

export const ToolsPanelWrapper = ({ children }: { children: ReactNode }) => {
  const { resetDemoConfig, configure, language, currency, checkoutMethod, elementsStyle, elementsExpressCheckoutEnabled, elementsAddressFormEnabled, cryptoEnabled, stripePublishableKey, stripeSecretKey, onboardingType, chargeType, useV2Accounts, treasuryCapabilityEnabled, onboardCollectionFields, capitalFinancingPromotionLayout } = useDemoConfig();
  const { clearCart } = useCart();
  const { signOut: signOutCustomer, updateCustomer, email: customerEmail } = useDemoCustomer();
  const { signOut: signOutMerchant, email: merchantEmail, updateMerchant } = useDemoMerchant();

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
                onChange: (value) => {
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
                onChange: (value) => {
                  configure('checkoutMethod', value);
                }
              },
              {
                type: 'text-input',
                label: 'Customer Email',
                value: customerEmail ?? null,
                onChange: (value) => {
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
                onChange: (value) => {
                  configure('elementsStyle', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Express Checkout Element',
                value: elementsExpressCheckoutEnabled,
                onChange: (value) => {
                  configure('elementsExpressCheckoutEnabled', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Address Element',
                value: elementsAddressFormEnabled,
                onChange: (value) => {
                  configure('elementsAddressFormEnabled', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Crypto Enabled',
                value: cryptoEnabled,
                onChange: (value) => {
                  configure('cryptoEnabled', value);
                }
              }
            ],
          },
          apiKeysAndEnvironment: {
            items: [
              {
                type: 'text-input',
                label: 'Stripe Publishable Key',
                value: stripePublishableKey !== DEFAULT_DEMO_CONFIG.stripePublishableKey ? (stripePublishableKey ?? null) : null,
                onChange: (value) => {
                  configure('stripePublishableKey', value || DEFAULT_DEMO_CONFIG.stripePublishableKey);
                }
              },
              {
                type: 'text-input',
                label: 'Stripe Secret Key',
                value: stripeSecretKey ?? null,
                onChange: (value) => {
                  configure('stripeSecretKey', value || DEFAULT_DEMO_CONFIG.stripeSecretKey);
                }
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
                onChange: (value) => {
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
                onChange: (value) => {
                  configure('chargeType', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Use V2 Accounts',
                value: useV2Accounts,
                onChange: (value) => {
                  configure('useV2Accounts', value);
                }
              },
              {
                type: 'checkbox',
                label: 'Onboard with Treasury',
                value: treasuryCapabilityEnabled ?? false,
                onChange: (value) => {
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
                onChange: (value) => {
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
                onChange: (value) => {
                  configure('capitalFinancingPromotionLayout', value);
                }
              },
              {
                type: 'text-input',
                label: 'Merchant Email',
                value: merchantEmail,
                onChange: (value) => {
                  updateMerchant('email', value);
                }
              },
            ]
          }
        },
        onReset,
      }
    }}>
      {children}
    </ToolsPanelProvider>
  );
};

