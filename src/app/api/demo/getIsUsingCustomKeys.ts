'use server';

const SHARED_KEYS = [
  'pk_test_51S8MLp8K76kI4BsQ',
  'sk_test_51S8MLp8K76kI4BsQ',
] as const;

export const getIsUsingCustomKeys = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY,
}) => {
  return SHARED_KEYS.every(
    (sharedKey) =>
      !stripeSecretKey?.startsWith(sharedKey) &&
      !stripePublishableKey?.startsWith(sharedKey),
  );
};
