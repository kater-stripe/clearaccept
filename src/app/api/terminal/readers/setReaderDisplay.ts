'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import type { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type SetReaderDisplayParams = {
  readerId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
  currency: CurrencyCode;
  items: Item[];
  tax: number;
  total: number;
};

export const setReaderDisplay = async ({
  readerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
  currency,
  items,
  tax,
  total,
}: SetReaderDisplayParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to set reader display because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  if (items.length === 0) {
    const reader = await stripe.terminal.readers.cancelAction(
      readerId,
      {},
      chargeType === 'direct' ? { stripeAccount: accountId } : {},
    );

    return plain(reader);
  }

  const reader = await stripe.terminal.readers.setReaderDisplay(
    readerId,
    {
      type: 'cart',
      cart: {
        currency,
        line_items: items.map((item) => ({
          amount: item.price.unit_amount ?? 0,
          description: item.product.name,
          quantity: item.quantity,
        })),
        tax,
        total,
      },
    },
    chargeType === 'direct' ? { stripeAccount: accountId } : {},
  );

  return plain(reader);
};
