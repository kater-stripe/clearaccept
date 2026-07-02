import { Stripe } from 'stripe';

type StripeParameters = ConstructorParameters<typeof Stripe>;

export const initializeStripe = (
  apiKey: StripeParameters[0],
  options?: Omit<NonNullable<StripeParameters[1]>, 'typescript' | 'httpClient'> & {
    hideApiActivity?: boolean;
  },
): Stripe => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hideApiActivity: _hideApiActivity, ...stripeOptions } = options ?? {};

  return new Stripe(apiKey, {
    ...stripeOptions,
    typescript: true,
  });
};
