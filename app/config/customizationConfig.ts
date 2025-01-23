"use server";

export const getEnv = async () => ({
  primaryColor: process.env.PRIMARY_COLOR,
  secondaryColor: process.env.SECONDARY_COLOR,
  customLogo: process.env.CUSTOM_LOGO,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  language: process.env.LANGUAGE,
  currency: process.env.CURRENCY,
  checkoutMethod: process.env.CHECKOUT_METHOD,
  isDemogen: process.env.IS_DEMOGEN,
});
