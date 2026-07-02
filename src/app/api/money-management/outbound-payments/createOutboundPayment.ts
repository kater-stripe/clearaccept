'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import type { Stripe } from 'stripe';

type CreateOutboundPaymentParams = {
  connectedAccountId: string;
  fromFinancialAccountId: string;
  recipientAccountId: string;
  payoutMethodId: string;
  amount: number;
  currency: string; // Source/amount currency (merchant's currency)
  destinationCurrency?: string; // Destination currency (payout method's currency) - defaults to source currency if not provided
  description?: string;
  stripeSecretKey?: string;
};

/**
 * Creates an outbound payment from a connected account's financial account to a recipient.
 * Uses Stripe-Context header with the connected account ID.
 * This follows the FA4P (Financial Accounts for Platforms) pattern.
 */
export const createOutboundPayment = async ({
  connectedAccountId,
  fromFinancialAccountId,
  recipientAccountId,
  payoutMethodId,
  amount,
  currency,
  destinationCurrency,
  description,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateOutboundPaymentParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create outbound payment because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // GB bank account payout methods (gbba_ prefix) require Confirmation of Payee
  // before an outbound payment can be created. Initiate then acknowledge CoP.
  if (payoutMethodId.startsWith('gbba_')) {
    const copContext = `${connectedAccountId}/${recipientAccountId}`;
    const copBase = `https://api.stripe.com/v2/core/vault/gb_bank_accounts/${payoutMethodId}`;
    const copHeaders: Record<string, string> = {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Stripe-Version': '2026-06-24.preview',
      'Stripe-Context': copContext,
    };
    // Initiate CoP (ignore if already initiated)
    await fetch(`${copBase}/initiate_confirmation_of_payee`, { method: 'POST', headers: copHeaders }).catch(() => {});
    // Acknowledge CoP
    await fetch(`${copBase}/acknowledge_confirmation_of_payee`, { method: 'POST', headers: copHeaders }).catch(() => {});
  }

  try {
    // Create outbound payment from connected account's financial account
    // Use stripeContext with the connected account ID for v2 APIs
    // Use destination currency if provided, otherwise fall back to source currency
    const toCurrency = destinationCurrency || currency;

    let outboundPaymentQuote: Stripe.V2.MoneyManagement.OutboundPaymentQuote | null =
      null;

    if (toCurrency !== currency) {
      outboundPaymentQuote =
        await stripe.v2.moneyManagement.outboundPaymentQuotes.create(
          {
            from: {
              financial_account: fromFinancialAccountId,
              currency,
            },
            to: {
              recipient: recipientAccountId,
              payout_method: payoutMethodId,
              currency: toCurrency,
            },
            amount: {
              value: amount,
              currency,
            },
          },
          {
            stripeContext: connectedAccountId,
          },
        );
    }

    const outboundPayment =
      await stripe.v2.moneyManagement.outboundPayments.create(
        {
          from: {
            financial_account: fromFinancialAccountId,
            currency,
          },
          to: {
            recipient: recipientAccountId,
            payout_method: payoutMethodId,
            currency: toCurrency,
          },
          ...(outboundPaymentQuote
            ? {
                outbound_payment_quote: outboundPaymentQuote.id,
              }
            : {}),
          amount: {
            value: amount,
            currency,
          },
          description: description || 'Payment to third-party',
        },
        {
          stripeContext: connectedAccountId,
        },
      );

    return plain(outboundPayment);
  } catch (error) {
    console.error(
      `Unable to create outbound payment from ${fromFinancialAccountId} to recipient ${recipientAccountId} via payout method ${payoutMethodId}`,
      error,
    );

    return {
      message: 'modals.outbound-payment.error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
