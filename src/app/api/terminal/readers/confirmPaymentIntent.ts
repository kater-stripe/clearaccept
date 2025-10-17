'use server';

import type { DemoConfig } from '@/types/demoConfig';
import type { Item } from '@/types/item';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type ConfirmPaymentIntentParams = {
  readerId: string;
  paymentIntentId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  items: Item[];
  accountId: string;
  customerId?: string;
};

export const confirmPaymentIntent = async ({
  readerId,
  paymentIntentId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  items,
  accountId,
  customerId,
}: ConfirmPaymentIntentParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to confirm payment intent because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const reader = await stripe.terminal.readers.confirmPaymentIntent(
    readerId,
    {
      payment_intent: paymentIntentId,
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  const subscriptionItems = items.filter(
    (item) => item.price.recurring !== null,
  );

  if (subscriptionItems.length > 0) {
    if (!customerId) {
      throw new Error(
        'Unable to start subscriptions because a customer ID was not provided.',
      );
    }

    const paymentIntent = (await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ['latest_charge'],
      },
      chargeType === 'direct'
        ? {
            stripeAccount: accountId,
          }
        : undefined,
    )) as Stripe.PaymentIntent & { latest_charge: Stripe.Charge };

    for (const subscriptionItem of subscriptionItems) {
      const trialEnd = new Date();

      switch (subscriptionItem.price.recurring!.interval) {
        case 'day':
          trialEnd.setDate(trialEnd.getDate() + 1);
          break;
        case 'week':
          trialEnd.setDate(trialEnd.getDate() + 7);
          break;
        case 'month':
          trialEnd.setMonth(trialEnd.getMonth() + 1);
          break;
        case 'year':
          trialEnd.setFullYear(trialEnd.getFullYear() + 1);
          break;
        default:
          break;
      }

      await stripe.subscriptions.create(
        {
          customer: customerId,
          default_payment_method:
            paymentIntent.latest_charge.payment_method_details?.card_present
              ?.generated_card!,
          items: [
            {
              price: subscriptionItem.price.id,
              quantity: subscriptionItem.quantity,
            },
          ],
          trial_end: Math.floor(trialEnd.getTime() / 1000),
        },
        chargeType === 'direct'
          ? {
              stripeAccount: accountId,
            }
          : undefined,
      );
    }
  }

  return plain(reader);
};
