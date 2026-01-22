'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import type { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreatePaymentIntentParams = {
  items: Item[];
  stripeSecretKey?: string;
  customerId?: string;
  customerEmail?: string;
  taxAmount?: number;
  shippingCost?: number;
  currency: CurrencyCode;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
  applyOnrampDiscount?: boolean;
};

export const createPaymentIntent = async ({
  items,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  customerId,
  customerEmail,
  taxAmount = 0,
  shippingCost = 0,
  currency,
  chargeType,
  accountId,
  applyOnrampDiscount = false,
}: CreatePaymentIntentParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create payment intent because a secret key was not provided nor found in the environment variables.',
    );
  }

  const subtotal = items.reduce(
    (acc, item) => acc + (item.price.unit_amount ?? 0) * item.quantity,
    0,
  );

  const stripe = initializeStripe(stripeSecretKey);

  const discount = applyOnrampDiscount ? Math.floor(subtotal * 0.2) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const total = discountedSubtotal + taxAmount + shippingCost;

  const paymentIntent = await stripe.paymentIntents.create(
    {
      ...(customerId
        ? {
            customer: customerId,
            setup_future_usage: 'off_session',
          }
        : {}),
      receipt_email: customerEmail,
      amount: total,
      currency,
      ...(chargeType === 'destination' ||
      chargeType === 'destination-on-behalf-of'
        ? {
            transfer_data: {
              destination: accountId,
            },
          }
        : {}),
      ...(chargeType === 'destination-on-behalf-of'
        ? {
            on_behalf_of: accountId,
          }
        : {}),
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  if (paymentIntent.client_secret === null) {
    throw new Error('PaymentIntent client secret is null');
  }

  return plain(paymentIntent);
};
