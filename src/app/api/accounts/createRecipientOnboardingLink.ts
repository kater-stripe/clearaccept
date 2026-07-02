'use server';

const STRIPE_API_VERSION = '2026-06-24.preview';

type CreateRecipientOnboardingLinkParams = {
  connectedAccountId: string;
  recipientAccountId: string;
  returnUrl: string;
  stripeSecretKey?: string;
};

/**
 * Creates a v2 hosted onboarding link for a recipient account.
 * Uses POST /v2/core/account_links with Stripe-Account: <connectedAccountId>
 * so the platform can create links for recipients scoped to the connected account.
 */
export const createRecipientOnboardingLink = async ({
  connectedAccountId,
  recipientAccountId,
  returnUrl,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateRecipientOnboardingLinkParams) => {
  if (!stripeSecretKey) {
    throw new Error('No Stripe secret key provided');
  }

  const response = await fetch('https://api.stripe.com/v2/core/account_links', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Stripe-Version': STRIPE_API_VERSION,
      'Stripe-Account': connectedAccountId,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      account: recipientAccountId,
      return_url: returnUrl,
      refresh_url: returnUrl,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error?.error?.message || `Failed to create account link: ${response.status}`,
    );
  }

  const link = await response.json() as { url: string };
  return link;
};
