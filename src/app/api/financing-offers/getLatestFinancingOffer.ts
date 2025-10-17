'use server';

import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetFinancingOffersParams = {
  accountId: string;
  stripeSecretKey?: string;
};

export const getLatestFinancingOffer = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetFinancingOffersParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financing offers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const { data: offers } = await stripe.capital.financingOffers.list({
    connected_account: accountId,
  });

  const latestOffer =
    offers.sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    )[0] ?? null;

  return plain(latestOffer);
};
