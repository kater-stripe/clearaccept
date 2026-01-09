'use client';

import type { DemoConfig } from '@/types/demoConfig';

/**
 * The default demo configuration.
 * This constant provides plausible defaults that make sense for this specific demo repository.
 *
 * Any value in the {@link DemoConfig} type that aren't nullable should have a sensible default here, given environment variable
 * presence is not guarenteed and some fields could be accidentally forgotten.
 */
export const DEFAULT_DEMO_CONFIG = {
  country: 'US',
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? 'usd',
  customHero: process.env.NEXT_PUBLIC_CUSTOM_HERO,
  customLogo: process.env.NEXT_PUBLIC_CUSTOM_LOGO,
  demoName: process.env.NEXT_PUBLIC_DEMO_NAME ?? 'sage',
  language: process.env.NEXT_PUBLIC_LANGUAGE ?? 'en',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? '#221B35',
  secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR ?? '#F26552',
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripeSecretKey: undefined,
  terminalLocationId: undefined,
  terminalReaderId: undefined,
  capitalFinancingPromotionLayout: 'banner',
  chargeType: process.env.NEXT_PUBLIC_CHARGE_TYPE ?? 'direct',
  onboardingType: process.env.NEXT_PUBLIC_ONBOARDING_TYPE ?? 'embedded',
  treasuryCapabilityEnabled: false,
  issuingCapabilityEnabled: true,
  onboardCollectionFields: 'eventually_due',
  useV2Accounts: false,
  checkoutMethod:
    process.env.NEXT_PUBLIC_CHECKOUT_METHOD ?? 'elements-checkout',
  elementsStyle: 'accordion',
  elementsExpressCheckoutEnabled: true,
  elementsAddressFormEnabled: true,
  cryptoEnabled: true,
  customPaymentMethods: [],
  onrampDiscountEligible: false,
  onrampBannerVisible: true,
} as const satisfies DemoConfig;
