'use server';

import type { DemoConfig } from '@/types/demoConfig';

export const getDemoConfigFromServer = async (): Promise<
  Partial<DemoConfig>
> => {
  return {
    checkoutMethod: process.env.CHECKOUT_METHOD,
    currency: process.env.CURRENCY,
    customHero: process.env.CUSTOM_HERO,
    customLogo: process.env.CUSTOM_LOGO,
    demoName: process.env.DEMO_NAME,
    language: process.env.LANGUAGE,
    primaryColor: process.env.PRIMARY_COLOR,
    secondaryColor: process.env.SECONDARY_COLOR,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    chargeType: process.env.CHARGE_TYPE,
    onboardingType: process.env.ONBOARDING_TYPE,
  };
};
