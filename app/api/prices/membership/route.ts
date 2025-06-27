import initializeStripe from '@/app/utils/stripe/initializeStripe';
import {NextRequest, NextResponse} from 'next/server';

export const GET = async (request: NextRequest) => {
  const stripe = initializeStripe(request.headers);

  const {data: prices} = await stripe.prices.list({
    lookup_keys: ['membership'],
    expand: ['data.product'],
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

  return NextResponse.json(membershipPrice);
};
