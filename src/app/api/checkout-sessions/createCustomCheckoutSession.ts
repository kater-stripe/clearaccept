'use server';

import { allowedShippingAddressCountryCodes } from '@/constants/allowedShippingAddressCountryCodes';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { plain } from '@/utils/plain';
import type { StripeCheckoutShippingOption } from '@stripe/stripe-js';
import Stripe from 'stripe';

type CreateCustomCheckoutSessionParams = {
  items: Item[];
  stripeSecretKey?: string;
  customerId?: string;
  customerEmail?: string;
  language: SupportedLanguage;
  returnUrl: string;
  currency: CurrencyCode;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
  shippingOptionsOverride?: StripeCheckoutShippingOption[];
};

export const createCustomCheckoutSession = async ({
  items,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  customerId,
  customerEmail,
  language,
  returnUrl,
  currency,
  chargeType,
  accountId,
  shippingOptionsOverride,
}: CreateCustomCheckoutSessionParams) => {
  const hasSubscriptionInCart = items.some(
    ({ price }) => price.recurring !== null,
  );

  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create checkout session because a secret key was not provided nor found in the environment variables.',
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

  const lineItems = items.map((item) => {
    return {
      price_data: {
        currency: currency,
        product: item.product.id,
        unit_amount: item.price.unit_amount ?? 0,
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
        minimum: 0,
        maximum: 100,
      },
    };
  });

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
      adaptive_pricing: {
        enabled: true,
      },
      ...(hasSubscriptionInCart
        ? {
            billing_address_collection: 'required',
          }
        : {}),
      shipping_address_collection: {
        allowed_countries: [...allowedShippingAddressCountryCodes],
      },
      line_items: lineItems,
      mode: hasSubscriptionInCart ? 'subscription' : 'payment',
      ui_mode: 'custom',
      locale: language as Stripe.Checkout.SessionCreateParams.Locale,
      phone_number_collection: {
        enabled: true,
      },
      return_url: returnUrl,
      allow_promotion_codes: true,
      ...(hasSubscriptionInCart
        ? {}
        : {
            shipping_options: shippingOptionsOverride?.map(
              (shippingOption) => ({
                shipping_rate_data: {
                  display_name:
                    shippingOption.displayName ||
                    'checkout.shipping.unknown.title',
                  delivery_estimate: {
                    minimum: {
                      unit:
                        shippingOption.deliveryEstimate?.minimum?.unit ?? 'day',
                      value:
                        shippingOption.deliveryEstimate?.minimum?.value ?? 3,
                    },
                    maximum: {
                      unit:
                        shippingOption.deliveryEstimate?.maximum?.unit ?? 'day',
                      value:
                        shippingOption.deliveryEstimate?.maximum?.value ?? 5,
                    },
                  },
                  fixed_amount: {
                    amount: shippingOption.minorUnitsAmount,
                    currency: currency,
                  },
                  type: 'fixed_amount',
                  tax_behavior: defaultTaxBehavior,
                },
              }),
            ) ?? [
              {
                shipping_rate_data: {
                  display_name: 'checkout.shipping.standard.title',
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
                  tax_behavior: defaultTaxBehavior,
                },
              },
              {
                shipping_rate_data: {
                  display_name: 'checkout.shipping.priority.title',
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
                  tax_behavior: defaultTaxBehavior,
                },
              },
            ],
          }),
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
