'use server';

import type { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { plain } from '@/utils/plain';
import type { CurrencyCode } from '@/constants/currencyCodes';
import Stripe from 'stripe';

type CreateSubscriptionParams = {
  stripeSecretKey?: string;
  items: Item[];
  taxAmount?: number;
  customerId?: string;
  customerEmail?: string;
  currency: CurrencyCode;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const createSubscription = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  items,
  taxAmount = 0,
  customerId,
  customerEmail,
  currency,
  chargeType,
  accountId,
}: CreateSubscriptionParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create subscriptions because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const recurringItems = items.filter((item) => item.price.recurring !== null);

  const processedRecurringItems: Item[] = await Promise.all(
    recurringItems.map(async (item): Promise<Item> => {
      const productId = item.product.id;

      try {
        const prices = await stripe.prices.list(
          {
            product: productId,
            active: true,
          },
          chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
        );

        const matchingPrice = prices.data.find(
          (price) => price.currency.toLowerCase() === currency.toLowerCase(),
        );

        if (matchingPrice) {
          return {
            ...item,
            price: matchingPrice,
          };
        }

        const originalPrice = item.price;

        const updatedPrice = await stripe.prices.update(
          originalPrice.id,
          {
            currency_options: {
              [currency.toLowerCase()]: {
                unit_amount: originalPrice.unit_amount as number,
                tax_behavior: originalPrice.tax_behavior || 'unspecified',
              },
            },
          },
          chargeType === 'direct'
            ? {
                stripeAccount: accountId,
              }
            : undefined,
        );

        return {
          ...item,
          price: updatedPrice,
        };
      } catch (error) {
        console.error(
          `❌ Error processing price for product ${productId}:`,
          error,
        );
        throw new Error(
          `Failed to process price for product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }),
  );

  const taxRatePercentage =
    taxAmount > 0
      ? Math.round(
          taxAmount /
            items.reduce(
              (acc, item) =>
                acc + (item.price.unit_amount ?? 0) * item.quantity,
              0,
            ),
        )
      : 0;

  const taxRate = await stripe.taxRates.create(
    {
      tax_type: 'sales_tax',
      percentage: taxRatePercentage,
      display_name: 'Sales Tax',
      inclusive: true,
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  const nonRecurringItems = items.filter(
    (item) => item.price.recurring === null,
  );

  if (!customerId) {
    try {
      const { data: customers } = await stripe.customers.list(
        {
          email: customerEmail,
        },
        chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
      );

      if (customers.length === 0) {
        throw new Error(
          'Unable to find existing customer based on the provided e-mail when creating a subscription. Creating a new customer instead.',
        );
      }

      customerId = customers[0].id;
    } catch {
      const newCustomer = await stripe.customers.create(
        {
          email: customerEmail,
        },
        chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
      );

      customerId = newCustomer.id;
    }
  }

  const subscription = await stripe.subscriptions.create(
    {
      customer: customerId,
      currency: currency.toLowerCase(),
      collection_method: 'charge_automatically',
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      items: processedRecurringItems.map((item) => ({
        quantity: item.quantity,
        tax_rates: [taxRate.id],
        price_data: {
          currency: currency.toLowerCase(),
          product: item.product.id,
          unit_amount: item.price.unit_amount ?? 0,
          recurring: {
            interval: item.price.recurring!.interval,
            interval_count: item.price.recurring!.interval_count,
          },
          tax_behavior: item.price.tax_behavior as Stripe.Price.TaxBehavior,
        },
      })),
      ...(nonRecurringItems.length > 0
        ? {
            add_invoice_items: nonRecurringItems.map((item) => ({
              price_data: {
                currency: currency.toLowerCase(),
                product: item.product.id,
                unit_amount: item.price.unit_amount ?? 0,
              },
              quantity: item.quantity,
              tax_rates: [taxRate.id],
            })),
          }
        : {}),
      expand: ['latest_invoice.confirmation_secret'],
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

  const subscriptionWithConfirmationSecret = subscription as Omit<
    Stripe.Subscription,
    'latest_invoice'
  > & {
    latest_invoice: Stripe.Invoice;
  };

  return plain(subscriptionWithConfirmationSecret);
};
