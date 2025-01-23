import {type NextRequest} from 'next/server';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import {stripe} from '@/lib/stripe';
import type {AccountInterface} from '@/types/account';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    let stripeAccountId = session?.user?.stripeAccount?.id;
    if (!stripeAccountId) {
      return new Response(
        JSON.stringify({
          error: 'No Stripe account found for this user',
        }),
        {status: 400}
      );
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    const accountData: AccountInterface = {
      id: account.id,
      country: account.country || 'US',
      treasury_enabled: account.capabilities?.treasury === 'active',
      card_issuing_enabled: account.capabilities?.card_issuing === 'active',
    };

    return new Response(JSON.stringify(accountData), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  } catch (error: any) {
    console.error(
      'An error occurred when calling the Stripe API to get the account',
      error
    );
    return new Response(JSON.stringify({error: error.message}), {status: 500});
  }
}
