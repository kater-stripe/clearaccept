'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateCustomerParams = {
  email: string;
  phone?: string;
  name: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
};

export const createCustomer = async ({
  email,
  phone,
  name,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
  address,
}: CreateCustomerParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create customer because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const customer = await stripe.customers.create(
    {
      email,
      phone: phone || undefined,
      name,
      address: address?.line1
        ? {
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city || undefined,
            state: address.state || undefined,
            postal_code: address.postal_code || undefined,
            country: address.country || undefined,
          }
        : undefined,
      metadata: {
        accountId,
      },
    },
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
  );

  return plain(customer);
};
