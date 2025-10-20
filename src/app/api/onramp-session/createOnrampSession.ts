'use server';

import type {
  OnrampCreateBody,
  OnrampSessionResponse,
  OnrampCreateParams,
  OnrampSession,
} from '@/types/onramp';
import { DestinationCurrency, DestinationNetwork } from '@/types/onramp';
import Stripe from 'stripe';

const OnrampSessions = Stripe.StripeResource.extend({
  create: Stripe.StripeResource.method({
    method: 'POST',
    path: 'crypto/onramp_sessions',
  }),
}) as unknown as {
  new (stripe: Stripe): { create: (body: OnrampCreateParams) => Promise<OnrampSession> };
};

export const createOnrampSession = async ({
  body,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: {
  body: OnrampCreateBody;
  stripeSecretKey?: string;
}): Promise<OnrampSessionResponse> => {
  if (!stripeSecretKey) {
    throw new Error('Missing Stripe secret key');
  }

  const {
    source_currency,
    amount,
    destination_currencies,
    destination_networks,
    destination_currency,
    destination_network,
  } = body || {};

  const payload: OnrampCreateParams = {};

  if (source_currency) payload.source_currency = source_currency;
  if (Array.isArray(destination_currencies)) payload.destination_currencies = destination_currencies;
  if (Array.isArray(destination_networks)) payload.destination_networks = destination_networks;
  if (destination_currency) payload.destination_currency = destination_currency;
  if (destination_network) payload.destination_network = destination_network;

  // default to USDC Ethereum
  const hasDestPair = Boolean(destination_currency || destination_network);
  const hasRestrictions = Array.isArray(destination_currencies) || Array.isArray(destination_networks);
  if (!hasDestPair && !hasRestrictions) {
    payload.destination_currency = DestinationCurrency.Usdc;
    payload.destination_network = DestinationNetwork.Ethereum;
  }

  if (amount?.source_amount) {
    payload.source_amount = String(amount.source_amount);
  } else if (amount?.destination_amount) {
    payload.destination_amount = String(amount.destination_amount);
  }

  const stripe = new Stripe(stripeSecretKey);
  const onramps = new OnrampSessions(stripe);
  const session = await onramps.create(payload);

  return {
    id: session.id,
    redirect_url: session?.redirect_url,
    client_secret: session.client_secret,
  };
};
