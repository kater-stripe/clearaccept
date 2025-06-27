import initializeStripe from '@/app/utils/stripe/initializeStripe';
import {authOptions} from '@/lib/auth';
import {getServerSession} from 'next-auth';
import {NextRequest, NextResponse} from 'next/server';

export const GET = async (request: NextRequest) => {
  const stripe = initializeStripe(request.headers);

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(null);
    }

    const {data: subscriptions} = await stripe.subscriptions.list({
      customer: session.user.customerId,
    });

    const subscription = subscriptions.find(
      (subscription) =>
        subscription.items.data.some(
          (item) => item.price.lookup_key === 'membership'
        ) && subscription.status === 'active'
    );

    return NextResponse.json(subscription ?? null);
  } catch (error) {
    console.error(error);

    return NextResponse.json(null);
  }
};
