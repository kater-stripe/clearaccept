'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import type { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type CreateEmbeddedCheckoutSessionParams = {
  items: Item[];
  stripeSecretKey?: string;
  customerId?: string;
  customerEmail?: string;
  language: SupportedLanguage;
  returnUrl: string;
  currency: CurrencyCode;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const createEmbeddedCheckoutSession = async ({
  items,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  customerId,
  customerEmail,
  language,
  returnUrl,
  currency,
  chargeType,
  accountId,
}: CreateEmbeddedCheckoutSessionParams) => {
  const hasSubscriptionInCart = items.some(
    ({ price }) => price.recurring !== null,
  );

  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create embedded checkout session because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const taxSettings = await stripe.tax.settings.retrieve(
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  const defaultTaxBehavior =
    (taxSettings.defaults.tax_behavior === 'inferred_by_currency'
      ? currency === 'usd' || currency === 'cad'
        ? 'exclusive'
        : 'inclusive'
      : taxSettings.defaults.tax_behavior) ??
    (currency === 'usd' || currency === 'cad' ? 'exclusive' : 'inclusive');

  // Prepare line items
  const lineItems = items.map((item) => {
    if (!item.product.name || !item.price.unit_amount || !item.quantity) {
      throw new Error('Invalid cart item');
    }

    return {
      price_data: {
        currency,
        product: item.product.id,
        unit_amount: item.price.unit_amount,
        tax_behavior:
          item.price.tax_behavior === 'unspecified'
            ? defaultTaxBehavior
            : (item.price.tax_behavior ?? defaultTaxBehavior),
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
    };
  });

  // Prepare session options
  const sessionOptions: Stripe.Checkout.SessionCreateParams = {
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
    ui_mode: 'embedded',
    ...(taxSettings.head_office !== null
      ? {
          automatic_tax: {
            enabled: true,
            ...(chargeType === 'destination-on-behalf-of'
              ? {
                  liability: {
                    account: accountId,
                    type: 'account',
                  },
                }
              : {}),
          },
        }
      : {}),
    locale: language,
    line_items: lineItems,
    mode: hasSubscriptionInCart ? 'subscription' : 'payment',
    return_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    allow_promotion_codes: true,
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
  };

  if (!hasSubscriptionInCart) {
    sessionOptions.shipping_options = [
      {
        shipping_rate_data: {
          display_name: 'Standard shipping',
          delivery_estimate: {
            minimum: { unit: 'day', value: 3 },
            maximum: { unit: 'day', value: 5 },
          },
          fixed_amount: {
            amount: 850,
            currency: currency,
          },
          type: 'fixed_amount',
          tax_behavior: defaultTaxBehavior,
        },
      },
      {
        shipping_rate_data: {
          display_name: 'Priority shipping',
          delivery_estimate: {
            minimum: { unit: 'day', value: 1 },
            maximum: { unit: 'day', value: 2 },
          },
          fixed_amount: {
            amount: 1500,
            currency: currency,
          },
          type: 'fixed_amount',
          tax_behavior: defaultTaxBehavior,
        },
      },
    ];
  }

  const session = await stripe.checkout.sessions.create(
    sessionOptions,
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(session);
};
