export const CHECKOUT_METHODS = [
  'stripe-checkout',
  'embedded-checkout',
  'elements-checkout',
  'elements-checkout-with-checkout-sessions',
] as const;

export type CheckoutMethod = (typeof CHECKOUT_METHODS)[number];
