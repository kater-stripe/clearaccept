'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

export const calculateTax = async ({
  items,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  currency,
  shippingAddress,
  chargeType,
  accountId,
  shippingCost,
}: {
  items: Item[];
  stripeSecretKey?: string;
  currency: CurrencyCode;
  shippingAddress: Stripe.Tax.CalculationCreateParams.CustomerDetails.Address;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
  shippingCost?: number;
}) => {
  if (items.length === 0) {
    return {
      tax_amount_exclusive: 0,
      tax_amount_inclusive: 0,
      amount_total: 0,
    };
  }

  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get coupon because a secret key was not provided nor found in the environment variables for the subscription account.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const taxSettings = await stripe.tax.settings.retrieve();

  const accountLevelTaxBehavior = (() => {
    if (taxSettings.defaults.tax_behavior === 'inferred_by_currency') {
      if (currency === 'usd' || currency === 'cad') {
        return 'exclusive';
      }

      return 'inclusive';
    }

    return taxSettings.defaults.tax_behavior ?? undefined;
  })();

  const lineItems = items.map((cartItem) => {
    let itemTaxBehavior;

    if (
      cartItem.price.tax_behavior === null ||
      cartItem.price.tax_behavior === 'unspecified'
    ) {
      itemTaxBehavior = accountLevelTaxBehavior;
    } else {
      itemTaxBehavior = cartItem.price.tax_behavior;
    }

    return {
      reference: cartItem.price.id,
      amount: (cartItem.price.unit_amount ?? 0) * cartItem.quantity,
      quantity: cartItem.quantity,
      product: cartItem.product.id,
      tax_code: (cartItem.product.tax_code as string) ?? 'txcd_99999999',
      tax_behavior: itemTaxBehavior,
    } satisfies Stripe.Tax.CalculationCreateParams.LineItem;
  });

  try {
    const taxCalculation = await stripe.tax.calculations.create(
      {
        currency,
        line_items: lineItems,
        customer_details: {
          address: shippingAddress,
          address_source: 'shipping',
        },
        shipping_cost: {
          amount: shippingCost ?? 0,
          tax_behavior: accountLevelTaxBehavior,
        },
      },
      chargeType === 'direct'
        ? {
            stripeAccount: accountId,
          }
        : undefined,
    );

    return plain(taxCalculation);
  } catch (error) {
    console.error('Unable to calculate tax for transaction.', error);

    const totalWithoutTax = items.reduce((acc, item) => {
      return acc + (item.price.unit_amount ?? 0) * item.quantity;
    }, 0);

    return {
      tax_amount_exclusive: 0,
      tax_amount_inclusive: 0,
      amount_total: totalWithoutTax,
    };
  }
};
