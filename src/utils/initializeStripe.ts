import { initializeStripeWithApiActivity } from '@demoeng/tools-panel';
import { Stripe } from 'stripe';
import { cookies } from 'next/headers';

export const initializeStripe = initializeStripeWithApiActivity({
    Stripe,
    cookies,
});