import Stripe from 'stripe';
import {withFallbackHeaders} from './withFallbackHeaders';

const initializeStripe = (headerList: Headers) => {
  const {stripeSecretKey} = withFallbackHeaders(headerList);

  if (!stripeSecretKey) {
    throw new Error('Stripe secret key is not defined');
  }

  return new Stripe(stripeSecretKey, {
    // @ts-ignore
    // apiVersion: '2023-10-16',
    // if your account has been added to embedded connect beta:
    apiVersion: '2023-10-16; embedded_connect_beta=v2;',
  });
};

export default initializeStripe;
