'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateCardholderParams = {
  name: string;
  email: string;
  phoneNumber: string;
  type: 'individual' | 'company';
  firstName?: string;
  lastName?: string;
  billing: {
    city: string;
    country: string;
    line1: string;
    postalCode: string;
    state?: string;
  };
  accountId: string;
  stripeSecretKey?: string;
};

export const createCardholder = async ({
  name,
  email,
  phoneNumber,
  type,
  firstName,
  lastName,
  billing,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateCardholderParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create cardholder because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const cardholder = await stripe.issuing.cardholders.create(
      {
        name,
        email,
        phone_number: phoneNumber,
        type,
        status: 'active',
        billing: {
          address: {
            city: billing.city,
            country: billing.country,
            line1: billing.line1,
            postal_code: billing.postalCode,
            state: billing.state ?? '',
          },
        },
        ...(type === 'individual' && firstName && lastName
          ? {
              individual: {
                first_name: firstName,
                last_name: lastName,
                card_issuing: {
                  user_terms_acceptance: {
                    date: Math.floor(Date.now() / 1000),
                    ip: '127.0.0.1',
                  },
                },
              },
            }
          : {}),
      },
      {
        stripeAccount: accountId,
      },
    );

    return plain(cardholder);
  } catch (error) {
    console.error('Unable to create cardholder:', error);

    return {
      message: 'An error occurred while creating the cardholder.',
    };
  }
};

