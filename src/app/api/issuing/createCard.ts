'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateCardParams = {
  cardholderId: string;
  type: 'virtual' | 'physical';
  currency: string;
  status?: 'active' | 'inactive';
  financialAccountId?: string;
  accountId: string;
  stripeSecretKey?: string;
};

export const createCard = async ({
  cardholderId,
  type,
  currency,
  status = 'active',
  financialAccountId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateCardParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create card because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // Ensure the card_creator (v2) and card_issuing (v1) capabilities are requested.
  try {
    await stripe.v2.core.accounts.update(accountId, {
      configuration: {
        card_creator: {
          capabilities: {
            commercial: {
              stripe: {
                prepaid_card: { requested: true },
              },
            },
          },
        },
      } as any,
    });
  } catch {
    // Platform may not be Issuing-enabled; the cards.create call will surface the real error.
  }

  try {
    await stripe.accounts.update(accountId, {
      capabilities: { card_issuing: { requested: true } },
    });
  } catch {
    // Same — silently ignored if platform isn't Issuing-enabled.
  }

  // Apply the platform's issuing program to the connected account.
  // Required for Treasury-linked cards (financial_account_v2).
  try {
    const programsRes = await fetch('https://api.stripe.com/v1/issuing/programs', {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Stripe-Version': '2026-06-24.preview; issuing_program_beta=v2',
      },
    });
    if (programsRes.ok) {
      const { data: programs } = await programsRes.json() as { data: { id: string }[] };
      const platformProgram = programs?.[0];
      if (platformProgram) {
        await fetch('https://api.stripe.com/v1/issuing/programs', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            'Stripe-Version': '2026-06-24.preview; issuing_program_beta=v2',
            'Stripe-Context': accountId,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            platform_program: platformProgram.id,
            is_default: 'true',
          }).toString(),
        });
      }
    }
  } catch {
    // Silently skip — not all platforms have issuing programs configured.
  }

  try {
    const card = await stripe.issuing.cards.create(
      {
        cardholder: cardholderId,
        type,
        currency,
        status,
        spending_controls: {
          spending_limits: [
            {
              amount: 100000000,
              interval: 'daily',
            },
            {
              amount: 100000000,
              interval: 'weekly',
            },
          ],
        },
        ...(financialAccountId
          ? { financial_account_v2: financialAccountId }
          : {}),
      },
      {
        stripeContext: accountId,
      },
    );

    return plain(card);
  } catch (error) {
    console.error('Unable to create card:', error);

    return {
      message: 'An error occurred while creating the card.',
    };
  }
};
