'use server';

import { initializeStripe } from '@/utils/initializeStripe';

type CreateAuthorizationParams = {
  amount: number;
  cardId: string;
  currency: string;
  merchantName: string;
  accountId: string;
  stripeSecretKey?: string;
};

export const createAuthorization = async ({
  amount,
  cardId,
  currency,
  merchantName,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateAuthorizationParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create authorization because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    // Create the authorization using the test helper
    const authorization =
      await stripe.testHelpers.issuing.authorizations.create(
        {
          merchant_amount: amount,
          card: cardId,
          merchant_currency: currency,
          merchant_data: {
            name: merchantName,
          },
        },
        {
          stripeAccount: accountId,
        },
      );

    console.log('Authorization:', authorization.id);

    // Check if the authorization was approved
    if (authorization.status !== 'pending') {
      return {
        success: false,
        message: `Authorization was ${authorization.status}. This may be due to insufficient funds in the financial account or card spending limits.`,
      };
    }

    // Capture the authorization immediately
    const captured = await stripe.testHelpers.issuing.authorizations.capture(
      authorization.id,
      {},
      {
        stripeAccount: accountId,
      },
    );

    return {
      success: true,
      authorizationId: captured.id,
    };
  } catch (error: unknown) {
    console.error('Error creating issuing authorization:', error);

    return {
      success: false,
      message:
        'An error occurred when creating the issuing authorization. ' +
        (error instanceof Error ? error.message : String(error)),
    };
  }
};
