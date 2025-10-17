import type { DemoConfig } from './types/demoConfig';

declare global {
  namespace NodeJS {
    /**
     * Keep the type between a server-sided environment variable and its `NEXT_PUBLIC_` (client-sided) counterpart the same.
     */
    interface ProcessEnv {
      /**
       * Whether the demo was generated from the Demo Hub.
       */
      DEMOGEN: string | undefined;

      /**
       * @see {@link DemoConfig.elements}
       */
      CHECKOUT_METHOD: DemoConfig['checkoutMethod'] | undefined;
      /**
       * @see {@link CHECKOUT_METHOD}
       */
      NEXT_PUBLIC_CHECKOUT_METHOD: DemoConfig['checkoutMethod'] | undefined;

      /**
       * @see {@link DemoConfig.elements}
       */
      CURRENCY: DemoConfig['currency'] | undefined;
      /**
       * @see {@link CURRENCY}
       */
      NEXT_PUBLIC_CURRENCY: DemoConfig['currency'] | undefined;

      /**
       * @see {@link DemoConfig.elements}
       */
      CUSTOM_HERO: DemoConfig['customHero'];
      /**
       * @see {@link CUSTOM_HERO}
       */
      NEXT_PUBLIC_CUSTOM_HERO: DemoConfig['customHero'];

      /**
       * @see {@link DemoConfig.elements}
       */
      CUSTOM_LOGO: DemoConfig['customLogo'];
      /**
       * @see {@link CUSTOM_LOGO}
       */
      NEXT_PUBLIC_CUSTOM_LOGO: DemoConfig['customLogo'];

      /**
       * @see {@link DemoConfig.demoName}
       */
      DEMO_NAME: DemoConfig['demoName'] | undefined;
      /**
       * @see {@link DEMO_NAME}
       */
      NEXT_PUBLIC_DEMO_NAME: DemoConfig['demoName'] | undefined;

      /**
       * @see {@link DemoConfig.elements}
       */
      LANGUAGE: DemoConfig['language'] | undefined;
      /**
       * @see {@link LANGUAGE}
       */
      NEXT_PUBLIC_LANGUAGE: DemoConfig['language'] | undefined;

      /**
       * @see {@link DemoConfig.elements}
       */
      PRIMARY_COLOR: DemoConfig['primaryColor'] | undefined;
      /**
       * @see {@link PRIMARY_COLOR}
       */
      NEXT_PUBLIC_PRIMARY_COLOR: DemoConfig['primaryColor'] | undefined;

      /**
       * @see {@link DemoConfig.secondaryColor}
       */
      SECONDARY_COLOR: DemoConfig['secondaryColor'] | undefined;
      /**
       * @see {@link SECONDARY_COLOR}
       */
      NEXT_PUBLIC_SECONDARY_COLOR: DemoConfig['secondaryColor'] | undefined;

      /**
       * @see {@link DemoConfig.stripeSecretKey}
       */
      STRIPE_SECRET_KEY: DemoConfig['stripeSecretKey'];

      /**
       * @see {@link DemoConfig.stripePublishableKey}
       */
      STRIPE_PUBLISHABLE_KEY: DemoConfig['stripePublishableKey'];

      /**
       * @see {@link STRIPE_PUBLISHABLE_KEY}
       */
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: DemoConfig['stripePublishableKey'];

      /**
       * @see {@link DemoConfig.chargeType}
       */
      CHARGE_TYPE: DemoConfig['chargeType'] | undefined;
      /**
       * @see {@link CHARGE_TYPE}
       */
      NEXT_PUBLIC_CHARGE_TYPE: DemoConfig['chargeType'] | undefined;

      /**
       * @see {@link DemoConfig.onboardingType}
       */
      ONBOARDING_TYPE: DemoConfig['onboardingType'] | undefined;
      /**
       * @see {@link ONBOARDING_TYPE}
       */
      NEXT_PUBLIC_ONBOARDING_TYPE: DemoConfig['onboardingType'] | undefined;
    }
  }

  interface Window {
    umami?: {
      track: (event: string, data?: any) => void;
      identify: ({ email }: { email: string }) => void;
    };
  }
}

export {};
