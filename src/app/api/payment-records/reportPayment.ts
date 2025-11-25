'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';
import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import { hasGate } from '@demoeng/utils/has-gate';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';

type ReportPaymentParams = {
  customPaymentMethodId: string;
  stripeSecretKey?: string;
  customerId?: string;
  amount: number;
  currency: CurrencyCode;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const reportPayment = async ({
  customPaymentMethodId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  customerId,
  amount,
  currency,
  chargeType,
  accountId,
}: ReportPaymentParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get prices because a secret key was not provided nor found in the environment variables.',
    );
  }

  const hasPaymentRecordReportingGate = await hasGate({
    gate: 'payment_attempt_records_feature',
    stripeSecretKey,
  });

  if (!hasPaymentRecordReportingGate) {
    return;
  }

  const stripe = new Stripe(stripeSecretKey, {
    // @ts-expect-error
    apiVersion: `${STRIPE_API_VERSION}; payment_records_beta=v1`,
  });

  const secondsSinceEpoch = Math.floor(Date.now() / 1000);

  const paymentRecord = await stripe.paymentRecords.reportPayment(
    {
      amount_requested: {
        value: amount,
        currency,
      },
      payment_method_details: {
        type: 'custom',
        custom: {
          type: customPaymentMethodId,
        },
      },
      customer_details: {
        customer: customerId,
      },
      initiated_at: secondsSinceEpoch,
      customer_presence: 'on_session',
      outcome: 'guaranteed',
      guaranteed: {
        guaranteed_at: secondsSinceEpoch,
      },
      processor_details: {
        type: 'custom',
        custom: {
          payment_reference: randomUUID(),
        },
      }
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  await plain(paymentRecord);
};
