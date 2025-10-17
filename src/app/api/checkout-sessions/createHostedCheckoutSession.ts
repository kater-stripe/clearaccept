'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type CreateHostedCheckoutSessionParams = {
  items: Item[];
  stripeSecretKey?: string;
  currency: CurrencyCode;
  customerId?: string;
  customerEmail?: string;
  language: SupportedLanguage;
  successUrl: string;
  cancelUrl: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const createHostedCheckoutSession = async ({
  items,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  currency,
  customerId,
  customerEmail,
  language,
  successUrl,
  cancelUrl,
  chargeType,
  accountId,
}: CreateHostedCheckoutSessionParams) => {
  const hasSubscriptionInCart = items.some(
    ({ price }) => price.recurring !== null,
  );

  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create hosted checkout session because a Stripe secret key was not provided nor found in the environment variables.',
    );
  }

  const lineItems = items.map((item) => ({
    price_data: {
      currency: currency,
      product: item.product.id,
      unit_amount: item.price.unit_amount ?? 0,
      ...(item.price.recurring !== null
        ? {
            recurring: {
              interval: item.price.recurring.interval,
              interval_count: item.price.recurring.interval_count,
            },
          }
        : {}),
    },
    quantity: item.quantity,
    adjustable_quantity: {
      enabled: true,
      minimum: 1,
      maximum: 100,
    },
  }));

  const stripe = new Stripe(stripeSecretKey);

  const taxSettings = await stripe.tax.settings.retrieve(
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  const session = await stripe.checkout.sessions.create(
    {
      ...(customerId
        ? {
            customer: customerId,
            customer_update: {
              address: 'auto',
              shipping: 'auto',
            },
            payment_method_data: {
              allow_redisplay: 'always',
            },
            ...(hasSubscriptionInCart
              ? {}
              : {
                  payment_intent_data: {
                    setup_future_usage: 'off_session',
                  },
                }),
          }
        : {
            customer_email: customerEmail,
          }),
      ...(taxSettings.head_office !== null
        ? {
            automatic_tax: {
              enabled: true,
            },
          }
        : {}),
      line_items: lineItems,
      mode: hasSubscriptionInCart ? 'subscription' : 'payment',
      locale: language,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      ...(!hasSubscriptionInCart
        ? {
            shipping_options: [
              {
                shipping_rate_data: {
                  display_name: 'Standard shipping',
                  delivery_estimate: {
                    minimum: {
                      unit: 'day',
                      value: 3,
                    },
                    maximum: {
                      unit: 'day',
                      value: 5,
                    },
                  },
                  fixed_amount: {
                    amount: 850,
                    currency: currency,
                  },
                  type: 'fixed_amount',
                },
              },
              {
                shipping_rate_data: {
                  display_name: 'Priority shipping',
                  delivery_estimate: {
                    minimum: {
                      unit: 'day',
                      value: 1,
                    },
                    maximum: {
                      unit: 'day',
                      value: 2,
                    },
                  },
                  fixed_amount: {
                    amount: 1500,
                    currency: currency,
                  },
                  type: 'fixed_amount',
                },
              },
            ],
          }
        : {}),
      payment_intent_data: {
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
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(session);
};
