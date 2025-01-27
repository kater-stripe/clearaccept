'use client';

export const supportedLanguages = [
  'en',
  'fr',
  'es',
  'de',
  'ja',
  'en-GB',
  'it',
  'default',
];

export const defaultDemoSettings = {
  checkoutMethod: process.env.NEXT_PUBLIC_CHECKOUT_METHOD,
  country: process.env.NEXT_PUBLIC_COUNTRY,
  currency: process.env.NEXT_PUBLIC_CURRENCY,
  language: process.env.NEXT_PUBLIC_LANGUAGE,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  email: process.env.NEXT_PUBLIC_USER_EMAIL,
  version: process.env.NEXT_PUBLIC_SETTINGS_VERSION,
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR,
  secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR,
  customLogo: process.env.NEXT_PUBLIC_CUSTOM_LOGO,
  authImage: process.env.NEXT_PUBLIC_AUTH_IMAGE,
  eceEnabled: true,
  addressEnabled: true,
  customerPortalEnabled: true,
  externalPaymentMethod: null,
  applicationFee: '1.00',
};

export const defaultCartSettings = {
  items: [],
  shippingMethod: 'standard',
  shippingCost: 0,
  discount: 0,
  isCartOpen: false,
  tax: 0,
};
