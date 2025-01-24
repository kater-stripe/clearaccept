import Stripe from 'stripe';
import {withFallbackHeaders} from './withFallbackHeaders';

const initializeStripe = (headerList: Headers) => {
  const {stripeSecretKey} = withFallbackHeaders(headerList);

  if (!stripeSecretKey) {
    throw new Error('Stripe secret key is not defined');
  }

  return new Stripe(stripeSecretKey);
};

export default initializeStripe;
