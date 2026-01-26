'use client';

import '@/styles/global.css';

import { DemoConfigProvider, useDemoConfig } from '@/context/DemoConfigContext';
import { DemoCustomerProvider, useDemoCustomer } from '@/context/DemoCustomerContext';
import { CartProvider, useCart } from '@/context/CartContext';
import Script from 'next/script';
import { Suspense, type PropsWithChildren, type ReactNode } from 'react';
import { QueryClientProvider } from '@/context/QueryClientContext';
import { UmamiProvider } from '@/context/UmamiContext';
import { DemoMerchantProvider, useDemoMerchant } from '@/context/DemoMerchantContext';
import { HandleCallbacksProvider } from '@/components/checkout/HandleCallbacks';
import { ToolsPanelProvider } from '@demoeng/tools-panel';
import { Cog6ToothIcon, CurrencyDollarIcon, KeyIcon } from '@heroicons/react/20/solid';
import { generateRandomEmail } from '@/utils/generateRandomEmail';
import { CURRENCY_CODES } from '@/constants/currencyCodes';
import { DEFAULT_DEMO_CONFIG } from '@/constants/demoConfig';

const ToolsPanelWrapper = ({ children }: { children: ReactNode }) => {
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
                  configure('stripePublishableKey', value);
                }
              },
              {
                type: 'text-input',
                label: 'Stripe Secret Key',
                value: stripeSecretKey ?? null,
                onChange: (value) => {
                  configure('stripeSecretKey', value);
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

const RootLayout = ({ children }: PropsWithChildren) => {
  const nodeEnv = process.env.NODE_ENV;
  const isDemogen = !!process.env.DEMOGEN;
  return (
    <html>
      <head>
        <meta name='robots' content='noindex, nofollow' />

        {/* POSTHOG & UMAMI - DO NOT REMOVE */}
        <Script id='environment' strategy='beforeInteractive'>
          {`
  function getEnvironment() {
    const hostname = window.location.hostname;
    const nodeEnv = '${nodeEnv}';
    const isDemogen = ${isDemogen};
    
    if (nodeEnv === 'development') {
      return 'dev';
      } else if (nodeEnv === 'production' && hostname === 'pose.stripedemos.com' || hostname === 'zenflow.stripedemos.com') {
        return 'prod';
      } else if (nodeEnv === 'production' && hostname === 'pose-uat.stripedemos.com' || hostname === 'zenflow-uat.stripedemos.com') {
        return 'uat';
      } else if (isDemogen) {
        return 'personalized';
      } else {
        return 'other'
      }
  }
  
  window.currentEnvironment = getEnvironment();
          `}
        </Script>
        <Script id='posthog' strategy='beforeInteractive'>
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init hi Er $r ui br Sr capture Ri calculateEventProperties Tr register register_once register_for_session unregister unregister_for_session Or getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Rr Pr createPersonProfile Cr mr Fr opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing kr debug L Ir getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_FMazirhWDLORv5hyeQ3vC7Tfk9iCUg3exMHRhGxYzBL', {
        api_host: 'https://analytics-hub-v2.stripedemos.com',
        defaults: '2025-05-24',
        person_profiles: 'always',
            loaded: function(posthog) {
        posthog.register({
            environment: window.currentEnvironment,
            app_type: 'zenflow'
        });
        console.log('PostHog properties registered successfully');
    }
    })
          `}
        </Script>
        <Script
          src='https://analytics-hub.stripedemos.com/script.js'
          data-website-id='c6478f63-f260-4f70-b1ab-c6938c39426b'
          strategy='beforeInteractive'
        />
      </head>
      <body className='antialiased'>
        <QueryClientProvider>
          <Suspense>
            <UmamiProvider>
              <DemoConfigProvider>
                <DemoMerchantProvider>
                  <CartProvider>
                    <DemoCustomerProvider>
                      <ToolsPanelWrapper>
                        <HandleCallbacksProvider>
                          <div className='bg-white'>
                            {children}
                          </div>
                        </HandleCallbacksProvider>
                      </ToolsPanelWrapper>
                    </DemoCustomerProvider>
                  </CartProvider>
                </DemoMerchantProvider>
              </DemoConfigProvider>
            </UmamiProvider>
          </Suspense>
        </QueryClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
