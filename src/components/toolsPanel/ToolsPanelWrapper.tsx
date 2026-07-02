'use client';

import { type ReactNode, useRef, useState } from 'react';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useCart } from '@/context/CartContext';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { generateRandomEmail } from '@/utils/generateRandomEmail';
import { CURRENCY_CODES } from '@/constants/currencyCodes';
import { DEFAULT_DEMO_CONFIG } from '@/constants/demoConfig';
// ToolsPanelProvider removed — @demoeng/tools-panel replaced with passthrough
const ToolsPanelProvider = ({ children }: { children: React.ReactNode; config?: unknown }) => <>{children}</>;
import type { DemoConfig } from '@/types/demoConfig';
import type { DemoCustomer } from '@/types/demoCustomer';
import type { DemoMerchant } from '@/types/demoMerchant';
import { seedIssuing } from '@/app/api/issuing/seedIssuing';
import { seedFinancialAccountTransactions } from '@/app/api/money-management/financial-accounts/seedFinancialAccountTransactions';
import { seedTransactions } from '@/app/api/payment-intents/seedTransactions';
import { createCapitalOffer } from '@/app/api/financing-offers/createCapitalOffer';
import { createRiskIntervention } from '@/app/api/accounts/createRiskIntervention';
import { getLatestFinancingOffer } from '@/app/api/financing-offers/getLatestFinancingOffer';
import { expireFinancingOffer } from '@/app/api/financing-offers/expireFinancingOffer';
import { approveApplication } from '@/app/api/financing-offers/approveApplication';
import { rejectApplication } from '@/app/api/financing-offers/rejectApplication';
import { fullyRepayFinancingOffer } from '@/app/api/financing-offers/fullyRepayFinancingOffer';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateRandomBills, getBillsStorageKey } from '@/utils/bills';

export const ToolsPanelWrapper = ({ children }: { children: ReactNode }) => {
  const {
    resetDemoConfig,
    configure,
    demoName,
    language,
    currency,
    checkoutMethod,
    elementsStyle,
    elementsExpressCheckoutEnabled,
    elementsAddressFormEnabled,
    cryptoEnabled,
    stripePublishableKey,
    stripeSecretKey,
    onboardingType,
    chargeType,
    storerCapabilityEnabled,
    issuingCapabilityEnabled,
    onboardCollectionFields,
    capitalFinancingPromotionLayout,
  } = useDemoConfig();
  const { clearCart } = useCart();
  const {
    signOut: signOutCustomer,
    updateCustomer,
    email: customerEmail,
  } = useDemoCustomer();
  const {
    signOut: signOutMerchant,
    email: merchantEmail,
    updateMerchant,
    isSignedIn: isMerchantSignedIn,
    account,
    isCapabilityActive,
    isCapitalEligible,
  } = useDemoMerchant();

  // Seeding checkbox states
  const [shouldSeedRiskIntervention, setShouldSeedRiskIntervention] =
    useState(false);
  const [shouldSeedTransactions, setShouldSeedTransactions] = useState(false);
  const [shouldSeedCredits, setShouldSeedCredits] = useState(false);
  const [shouldSeedDebits, setShouldSeedDebits] = useState(false);
  const [shouldSeedCardholders, setShouldSeedCardholders] = useState(false);
  const [shouldSeedCards, setShouldSeedCards] = useState(false);
  const [shouldSeedCaptures, setShouldSeedCaptures] = useState(false);
  const [shouldSeedRefunds, setShouldSeedRefunds] = useState(false);

  // Seeding mutations
  const {
    mutateAsync: startSeedingTransactions,
    isPending: isSeedingTransactions,
    error: seedingTransactionsError,
  } = useMutation({
    mutationFn: seedTransactions,
  });

  const {
    mutateAsync: startSeedingIssuing,
    isPending: isSeedingIssuing,
    error: seedingIssuingError,
  } = useMutation({
    mutationFn: seedIssuing,
  });

  const {
    mutateAsync: startSeedingFinancialAccountTransactions,
    isPending: isSeedingFinancialAccountTransactions,
    error: seedingFinancialAccountTransactionsError,
  } = useMutation({
    mutationFn: seedFinancialAccountTransactions,
  });

  const {
    mutateAsync: startSeedingRiskIntervention,
    isPending: isSeedingRiskIntervention,
    error: seedingRiskInterventionError,
  } = useMutation({
    mutationFn: createRiskIntervention,
  });

  const isSeeding =
    isSeedingTransactions ||
    isSeedingIssuing ||
    isSeedingFinancialAccountTransactions ||
    isSeedingRiskIntervention;

  const seedingErrors = [
    seedingTransactionsError?.message,
    seedingIssuingError?.message,
    seedingFinancialAccountTransactionsError?.message,
    seedingRiskInterventionError?.message,
  ].filter(Boolean);

  // Financing offer state
  const [
    waitingForFinancingOfferToUpdate,
    setWaitingForFinancingOfferToUpdate,
  ] = useState(false);
  const latestFinancingOfferRef = useRef<Awaited<
    ReturnType<typeof getLatestFinancingOffer>
  > | null>(null);

  const { data: latestFinancingOffer } = useQuery({
    queryKey: ['latest-financing-offer', account?.id, stripeSecretKey],
    queryFn: async () => {
      const result = await getLatestFinancingOffer({
        accountId: account!.id,
        stripeSecretKey,
      });

      if (
        waitingForFinancingOfferToUpdate &&
        result?.status !== latestFinancingOfferRef.current?.status
      ) {
        window.location.reload();
        // We wait for the page to reload. This is a bit of a hack to ensure we don't update the state before the page has reloaded.
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      latestFinancingOfferRef.current = result;
      return result;
    },
    refetchInterval: waitingForFinancingOfferToUpdate ? 1000 : false,
    enabled: isMerchantSignedIn && !!account && isCapitalEligible,
  });

  // Get the merchant country to determine which loan type to create
  const merchantCountry = (account?.identity?.country ?? 'US') as 'US' | 'GB';

  // Financing offer mutations
  const { mutate: startCreatingCapitalOffer, isPending: isCreatingCapitalOffer } =
    useMutation({
      mutationKey: [
        'create-capital-offer',
        account?.id,
        stripeSecretKey,
        merchantCountry,
      ],
      mutationFn: createCapitalOffer,
      onSuccess: () => {
        setWaitingForFinancingOfferToUpdate(true);
      },
    });

  const {
    mutate: startExpiringFinancingOffer,
    isPending: isExpiringFinancingOffer,
  } = useMutation({
    mutationKey: ['expire-financing-offer', stripeSecretKey],
    mutationFn: expireFinancingOffer,
    onSuccess: () => {
      setWaitingForFinancingOfferToUpdate(true);
    },
  });

  const {
    mutate: startApprovingApplication,
    isPending: isApprovingApplication,
    error: approveApplicationError,
  } = useMutation({
    mutationKey: ['approve-application', stripeSecretKey],
    mutationFn: approveApplication,
    onSuccess: (result) => {
      if (result?.message) {
        throw new Error(result.message);
      }
      setWaitingForFinancingOfferToUpdate(true);
    },
  });

  const {
    mutate: startRejectingApplication,
    isPending: isRejectingApplication,
    error: rejectApplicationError,
  } = useMutation({
    mutationKey: ['reject-application', stripeSecretKey],
    mutationFn: rejectApplication,
    onSuccess: (result) => {
      if (result?.message) {
        throw new Error(result.message);
      }
      setWaitingForFinancingOfferToUpdate(true);
    },
  });

  const {
    mutate: startFullyRepayingFinancingOffer,
    isPending: isFullyRepayingFinancingOffer,
  } = useMutation({
    mutationKey: ['fully-repay-financing-offer', stripeSecretKey],
    mutationFn: fullyRepayFinancingOffer,
    onSuccess: () => {
      setWaitingForFinancingOfferToUpdate(true);
    },
  });

  const isFinancingActionPending =
    isCreatingCapitalOffer ||
    isExpiringFinancingOffer ||
    isApprovingApplication ||
    isRejectingApplication ||
    isFullyRepayingFinancingOffer ||
    waitingForFinancingOfferToUpdate;

  // Flex loan conditional display logic
  const shouldShowDeliverFlexLoanAction =
    isCapitalEligible &&
    (!latestFinancingOffer ||
      (latestFinancingOffer.status !== 'delivered' &&
        latestFinancingOffer.status !== 'completed' &&
        latestFinancingOffer.status !== 'accepted' &&
        latestFinancingOffer.status !== 'paid_out'));

  const shouldShowExpireAction =
    isCapitalEligible &&
    latestFinancingOffer &&
    (latestFinancingOffer.status === 'completed' ||
      latestFinancingOffer.status === 'delivered');

  const shouldShowApprovalAction =
    isCapitalEligible && latestFinancingOffer?.status === 'accepted';
  const shouldShowRejectionAction =
    isCapitalEligible && latestFinancingOffer?.status === 'accepted';
  const shouldShowFullyRepayAction =
    isCapitalEligible && latestFinancingOffer?.status === 'paid_out';

  const onReset = () => {
    resetDemoConfig();
    clearCart();
    signOutCustomer();
    signOutMerchant();
    updateMerchant('email', generateRandomEmail());
    updateCustomer('email', generateRandomEmail());
  };

  return (
    <ToolsPanelProvider
      config={{
        apiActivity: {
          enabled: true,
        },
        demoConfig: {
          enabled: true,
          tabs: {
            integrationAndLocalization: {
              items: [
                {
                  type: 'combobox',
                  label: 'Currency',
                  options: CURRENCY_CODES.map((currency) => ({
                    label: currency.toUpperCase(),
                    value: currency,
                  })),
                  value: currency,
                  onChange: (value: DemoConfig['currency']) => {
                    configure('currency', value);
                  },
                },
                {
                  type: 'dropdown',
                  label: 'Language',
                  options: [
                    { label: 'English', value: 'en' },
                    { label: 'English (UK)', value: 'en-GB' },
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
                  },
                },
                // {
                //   type: 'dropdown',
                //   label: 'Checkout Integration',
                //   options: [
                //     { label: 'Elements w/ PI', value: 'elements-checkout' },
                //     { label: 'Stripe-hosted page', value: 'hosted-checkout' },
                //     { label: 'Embedded form', value: 'embedded-checkout' },
                //     { label: 'Elements w/ CS', value: 'elements-checkout-with-checkout-sessions' },
                //   ],
                //   value: checkoutMethod,
                //   onChange: (value: DemoConfig['checkoutMethod']) => {
                //     configure('checkoutMethod', value);
                //   }
                // },
                // {
                //   type: 'text-input',
                //   label: 'Customer Email',
                //   value: customerEmail ?? '',
                //   onChange: (value: DemoCustomer['email']) => {
                //     updateCustomer('email', value);
                //   }
                // },
              ],
            },
            // checkout: {
            //   items: [
            //     {
            //       type: 'dropdown',
            //       label: 'Elements Style',
            //       options: [
            //         { label: 'Accordion', value: 'accordion' },
            //         { label: 'Tabs', value: 'tabs' },
            //       ],
            //       value: elementsStyle,
            //       onChange: (value: DemoConfig['elementsStyle']) => {
            //         configure('elementsStyle', value);
            //       }
            //     },
            //     {
            //       type: 'checkbox',
            //       label: 'Express Checkout Element',
            //       value: elementsExpressCheckoutEnabled,
            //       onChange: (value: DemoConfig['elementsExpressCheckoutEnabled']) => {
            //         configure('elementsExpressCheckoutEnabled', value);
            //       }
            //     },
            //     {
            //       type: 'checkbox',
            //       label: 'Address Element',
            //       value: elementsAddressFormEnabled,
            //       onChange: (value: DemoConfig['elementsAddressFormEnabled']) => {
            //         configure('elementsAddressFormEnabled', value);
            //       },
            //       tooltip: 'Tax will not be calculated without Address Element enabled.'
            //     },
            //     {
            //       type: 'checkbox',
            //       label: 'Crypto Enabled',
            //       value: cryptoEnabled,
            //       onChange: (value: DemoConfig['cryptoEnabled']) => {
            //         configure('cryptoEnabled', value);
            //       }
            //     }
            //   ],
            // },
            apiKeysAndEnvironment: {
              items: [
                ...(isMerchantSignedIn
                  ? [
                    {
                      type: 'alert' as const,
                      message:
                        'You are signed in. To edit these settings, please sign out first.',
                      content: [
                        {
                          type: 'button' as const,
                          label: 'Sign Out',
                          onClick: () => {
                            signOutMerchant();
                          },
                        },
                      ],
                    },
                  ]
                  : []),
                {
                  type: 'text-input',
                  label: 'Stripe Publishable Key',
                  value:
                    stripePublishableKey !==
                      DEFAULT_DEMO_CONFIG.stripePublishableKey
                      ? (stripePublishableKey ?? '')
                      : '',
                  onChange: (value: DemoConfig['stripePublishableKey']) => {
                    configure(
                      'stripePublishableKey',
                      value || DEFAULT_DEMO_CONFIG.stripePublishableKey,
                    );
                  },
                  disabled: isMerchantSignedIn,
                },
                {
                  type: 'text-input',
                  label: 'Stripe Secret Key',
                  value: stripeSecretKey ?? '',
                  onChange: (value: DemoConfig['stripeSecretKey']) => {
                    configure(
                      'stripeSecretKey',
                      value || DEFAULT_DEMO_CONFIG.stripeSecretKey,
                    );
                  },
                  disabled: isMerchantSignedIn,
                },
              ],
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
                  },
                },
                {
                  type: 'dropdown',
                  label: 'Charge Type',
                  options: [
                    { label: 'Direct', value: 'direct' },
                    { label: 'Destination', value: 'destination' },
                    {
                      label: 'Destination (On Behalf Of)',
                      value: 'destination-on-behalf-of',
                    },
                  ],
                  value: chargeType,
                  onChange: (value: DemoConfig['chargeType']) => {
                    configure('chargeType', value);
                  },
                },
                // ...(isMerchantSignedIn ? [{
                //   type: 'alert' as const,
                //   message: 'You are signed in. To change "Use V2 Accounts", please sign out first.',
                //   content: [{
                //     type: 'button' as const,
                //     label: 'Sign Out',
                //     onClick: () => {
                //       signOutMerchant();
                //     }
                //   }]
                // }] : []),
                // {
                //   type: 'checkbox',
                //   label: 'Use V2 Accounts',
                //   value: useV2Accounts,
                //   disabled: isMerchantSignedIn,
                //   onChange: (value: DemoConfig['useV2Accounts']) => {
                //     configure('useV2Accounts', value);
                //   },
                //   tooltip: 'If enabled, new accounts will be created using the V2 Accounts API.'
                // },
                {
                  type: 'checkbox',
                  label: 'Onboard with Storer',
                  value: storerCapabilityEnabled ?? false,
                  onChange: (value: DemoConfig['storerCapabilityEnabled']) => {
                    configure('storerCapabilityEnabled', value);
                  },
                },
                {
                  type: 'checkbox',
                  label: 'Onboard with Issuing',
                  value: issuingCapabilityEnabled ?? false,
                  onChange: (value: DemoConfig['issuingCapabilityEnabled']) => {
                    configure('issuingCapabilityEnabled', value);
                  },
                  tooltip:
                    'When onboarding with issuing capability enabled, a terms of service agreement will be collected.',
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
                  },
                },
                {
                  type: 'dropdown',
                  label: 'Financing Promotion Layout',
                  options: [
                    { label: 'Banner', value: 'banner' },
                    { label: 'Full', value: 'full' },
                  ],
                  value: capitalFinancingPromotionLayout ?? 'banner',
                  onChange: (
                    value: DemoConfig['capitalFinancingPromotionLayout'],
                  ) => {
                    configure('capitalFinancingPromotionLayout', value);
                  },
                },
                {
                  type: 'text-input',
                  label: 'Merchant Email',
                  value: merchantEmail ?? '',
                  onChange: (value: DemoMerchant['email']) => {
                    updateMerchant('email', value);
                  },
                },
              ],
            },
            ...(isMerchantSignedIn && account
              ? {
                seedingAndTestHelpers: {
                  items: [
                    // Account seeding
                    {
                      type: 'checkbox' as const,
                      label: 'Risk Intervention',
                      value: shouldSeedRiskIntervention,
                      disabled: isSeeding,
                      onChange: (value: boolean) =>
                        setShouldSeedRiskIntervention(value),
                    },
                    // Payments seeding
                    {
                      type: 'checkbox' as const,
                      label: 'Transactions',
                      value: shouldSeedTransactions,
                      disabled: isSeeding,
                      onChange: (value: boolean) =>
                        setShouldSeedTransactions(value),
                    },
                    // Treasury seeding (only if capability active)
                    ...(isCapabilityActive('treasury')
                      ? [
                        {
                          type: 'checkbox' as const,
                          label: 'Treasury Credits',
                          value: shouldSeedCredits,
                          disabled: isSeeding,
                          onChange: (value: boolean) =>
                            setShouldSeedCredits(value),
                        },
                        {
                          type: 'checkbox' as const,
                          label: 'Treasury Debits',
                          value: shouldSeedDebits,
                          disabled: isSeeding,
                          onChange: (value: boolean) =>
                            setShouldSeedDebits(value),
                        },
                      ]
                      : []),
                    // Issuing seeding (only if capability active)
                    ...(isCapabilityActive('commercial.stripe.prepaid_card')
                      ? [
                        {
                          type: 'checkbox' as const,
                          label: 'Cardholders',
                          value: shouldSeedCardholders,
                          disabled: isSeeding,
                          onChange: (value: boolean) => {
                            setShouldSeedCardholders(value);
                            if (!value) {
                              setShouldSeedCards(false);
                              setShouldSeedCaptures(false);
                              setShouldSeedRefunds(false);
                            }
                          },
                        },
                        {
                          type: 'checkbox' as const,
                          label: 'Cards',
                          value: shouldSeedCards,
                          disabled: isSeeding || !shouldSeedCardholders,
                          onChange: (value: boolean) => {
                            setShouldSeedCards(value);
                            if (!value) {
                              setShouldSeedCaptures(false);
                              setShouldSeedRefunds(false);
                            }
                          },
                        },
                        {
                          type: 'checkbox' as const,
                          label: 'Captures',
                          value: shouldSeedCaptures,
                          disabled: isSeeding || !shouldSeedCards,
                          onChange: (value: boolean) => {
                            setShouldSeedCaptures(value);
                            if (!value) {
                              setShouldSeedRefunds(false);
                            }
                          },
                        },
                        {
                          type: 'checkbox' as const,
                          label: 'Refunds',
                          value: shouldSeedRefunds,
                          disabled: isSeeding || !shouldSeedCaptures,
                          onChange: (value: boolean) =>
                            setShouldSeedRefunds(value),
                        },
                      ]
                      : []),
                    // Show seeding errors if any
                    ...(seedingErrors.length > 0
                      ? [
                        {
                          type: 'alert' as const,
                          message: seedingErrors.join(', '),
                        },
                      ]
                      : []),
                    // Start seeding button
                    {
                      type: 'button' as const,
                      label: isSeeding ? 'Seeding...' : 'Start Seeding',
                      disabled:
                        isSeeding ||
                        (!shouldSeedRiskIntervention &&
                          !shouldSeedTransactions &&
                          !shouldSeedCredits &&
                          !shouldSeedDebits &&
                          !shouldSeedCardholders),
                      onClick: async () => {
                        await Promise.all([
                          shouldSeedRiskIntervention
                            ? startSeedingRiskIntervention({
                              accountId: account.id,
                              stripeSecretKey,
                            })
                            : null,
                          shouldSeedTransactions
                            ? startSeedingTransactions({
                              accountId: account.id,
                              stripeSecretKey,
                              language,
                              chargeType,
                            })
                            : null,
                          shouldSeedCredits || shouldSeedDebits
                            ? startSeedingFinancialAccountTransactions({
                              accountId: account.id,
                              stripeSecretKey,
                              language,
                              seedCredits: shouldSeedCredits,
                              seedDebits: shouldSeedDebits,
                            })
                            : null,
                          shouldSeedCardholders
                            ? startSeedingIssuing({
                              accountId: account.id,
                              stripeSecretKey,
                              language,
                              seedCardholders: shouldSeedCardholders,
                              seedCards: shouldSeedCards,
                              seedCaptures: shouldSeedCaptures,
                              seedRefunds: shouldSeedRefunds,
                            })
                            : null,
                        ]);

                        if (seedingErrors.length === 0) {
                          window.location.reload();
                        }
                      },
                    },
                    {
                      type: 'separator' as const,
                    },
                    {
                      type: 'button' as const,
                      label: 'Generate Bills',
                      disabled: isSeeding,
                      onClick: () => {
                        const billsKey = getBillsStorageKey(demoName, account.id);
                        const existingBills = localStorage.getItem(billsKey);
                        const parsedBills = existingBills ? JSON.parse(existingBills) : [];
                        const newBills = generateRandomBills(currency, 3);
                        localStorage.setItem(billsKey, JSON.stringify([...parsedBills, ...newBills]));
                        window.location.reload();
                      },
                    },
                    // Capital / Flex Loan section (only if capital eligible)
                    ...(isCapitalEligible
                      ? [
                        {
                          type: 'separator' as const,
                        },
                        // Show error if approve/reject failed
                        ...(approveApplicationError
                          ? [
                            {
                              type: 'alert' as const,
                              message: approveApplicationError.message,
                            },
                          ]
                          : []),
                        ...(rejectApplicationError
                          ? [
                            {
                              type: 'alert' as const,
                              message: rejectApplicationError.message,
                            },
                          ]
                          : []),
                        // Deliver Capital Offer (Flex Loan for US, YouLend for GB)
                        ...(shouldShowDeliverFlexLoanAction
                          ? [
                            {
                              type: 'button' as const,
                              label: isFinancingActionPending
                                ? 'Creating...'
                                : merchantCountry === 'GB'
                                  ? 'Deliver YouLend Offer (GB)'
                                  : 'Deliver Flex Loan Offer (US)',
                              disabled:
                                isSeeding || isFinancingActionPending,
                              onClick: () => {
                                startCreatingCapitalOffer({
                                  accountId: account.id,
                                  country: merchantCountry,
                                  stripeSecretKey,
                                });
                              },
                            },
                          ]
                          : []),
                        // Expire Offer
                        ...(shouldShowExpireAction && latestFinancingOffer
                          ? [
                            {
                              type: 'button' as const,
                              label: isFinancingActionPending
                                ? 'Expiring...'
                                : 'Expire Offer',
                              disabled:
                                isSeeding || isFinancingActionPending,
                              onClick: () => {
                                startExpiringFinancingOffer({
                                  offerId: latestFinancingOffer.id,
                                  stripeSecretKey,
                                });
                              },
                            },
                          ]
                          : []),
                        // Approve Application
                        ...(shouldShowApprovalAction && latestFinancingOffer
                          ? [
                            {
                              type: 'button' as const,
                              label: isFinancingActionPending
                                ? 'Approving...'
                                : 'Approve Application',
                              disabled:
                                isSeeding || isFinancingActionPending,
                              onClick: () => {
                                startApprovingApplication({
                                  offerId: latestFinancingOffer.id,
                                  stripeSecretKey,
                                });
                              },
                            },
                          ]
                          : []),
                        // Reject Application
                        ...(shouldShowRejectionAction &&
                          latestFinancingOffer
                          ? [
                            {
                              type: 'button' as const,
                              label: isFinancingActionPending
                                ? 'Rejecting...'
                                : 'Reject Application',
                              disabled:
                                isSeeding || isFinancingActionPending,
                              onClick: () => {
                                startRejectingApplication({
                                  offerId: latestFinancingOffer.id,
                                  stripeSecretKey,
                                });
                              },
                            },
                          ]
                          : []),
                        // Fully Repay Offer
                        ...(shouldShowFullyRepayAction &&
                          latestFinancingOffer
                          ? [
                            {
                              type: 'button' as const,
                              label: isFinancingActionPending
                                ? 'Repaying...'
                                : 'Fully Repay Offer',
                              disabled:
                                isSeeding || isFinancingActionPending,
                              onClick: () => {
                                startFullyRepayingFinancingOffer({
                                  offerId: latestFinancingOffer.id,
                                  stripeSecretKey,
                                });
                              },
                            },
                          ]
                          : []),
                      ]
                      : []),
                  ],
                },
              }
              : {}),
          },
          onReset,
        },
      }}
    >
      {children}
    </ToolsPanelProvider>
  );
};
