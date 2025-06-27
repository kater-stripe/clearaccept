import initializeStripe from '@/app/utils/stripe/initializeStripe';
import {authOptions} from '@/lib/auth';
import {getServerSession} from 'next-auth';
import {NextRequest, NextResponse} from 'next/server';

export const POST = async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  const stripe = initializeStripe(request.headers);

  const {data: prices} = await stripe.prices.list({
    lookup_keys: ['membership'],
    limit: 1,
  });

  if (prices.length === 0) {
    return NextResponse.json(
      {
        error:
          'Membership price not found. Make sure seeded products and have a price with the `membership` lookup key.',
      },
      {status: 404}
    );
  }

  const [membershipPrice] = prices;

  const setupIntent = await stripe.setupIntents.create({
    customer_account: session.user.stripeAccount.id,
    payment_method_types: ['stripe_balance'],
    payment_method_data: {
      type: 'stripe_balance',
    },
    confirm: true,
  });

  const subscription = await stripe.subscriptions.create({
    default_payment_method: setupIntent.payment_method as string,
    customer_account: session.user.stripeAccount.id,
    items: [
      {
        price_data: {
          currency: session.user.stripeAccount.default_currency ?? 'usd',
          product: membershipPrice.product as string,
          recurring: {
            interval: membershipPrice.recurring?.interval ?? 'month',
            interval_count: membershipPrice.recurring?.interval_count ?? 1,
          },
          unit_amount: membershipPrice.unit_amount ?? 0,
        },
        quantity: 1,
      },
    ],
    payment_settings: {
      payment_method_types: ['stripe_balance'],
    },
  });

  return NextResponse.json(subscription);
};
