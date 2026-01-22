'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateCustomerSessionParams = {
  stripeSecretKey?: string;
  customerId: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const createCustomerSession = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  customerId,
  chargeType,
  accountId,
}: CreateCustomerSessionParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create customer session because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const customerSession = await stripe.customerSessions.create(
    {
      customer: customerId,
      components: {
        payment_element: {
          enabled: true,
          features: {
            payment_method_redisplay: 'enabled',
            payment_method_save: 'enabled',
            payment_method_save_usage: 'off_session',
          },
        },
      },
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(customerSession);
};
