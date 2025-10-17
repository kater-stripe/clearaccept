'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import { Stripe } from 'stripe';

type CreateReaderParams = {
  locationId: string;
  chargeType: DemoConfig['chargeType'];
  registrationCode: string;
  stripeSecretKey?: string;
  accountId: string;
};

export const createReader = async ({
  locationId,
  registrationCode,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
}: CreateReaderParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create terminal reader because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const reader = await stripe.terminal.readers.create(
    {
      location: locationId,
      registration_code: registrationCode,
    },
    /**
     * If we are using direct charges, we create the reader on the CA.
     * Otherwise, we create the reader on the platform.
     *
     * See https://docs.stripe.com/terminal/design-multiparty-platform#standard-connect for more information.
     */
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(reader);
};
