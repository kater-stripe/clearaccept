import { createInitializeStripe } from '@demoeng/tools-panel';
import { Stripe } from 'stripe';
import { cookies } from 'next/headers';

export const initializeStripe = createInitializeStripe({
    Stripe,
    cookies,
});