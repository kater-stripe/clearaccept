import Stripe from 'stripe';
import {withFallbackHeaders} from './withFallbackHeaders';

const initializeStripe = (headerList: Headers, version: 'v1' | 'v2' = 'v1') => {
  const {stripeSecretKey} = withFallbackHeaders(headerList);

  if (!stripeSecretKey) {
    throw new Error('Stripe secret key is not defined');
  }

  /**
   * We cannot pass beta headers to v2 APIs.
   */
  return new Stripe(stripeSecretKey, {
    // @ts-expect-error
    apiVersion: `2025-05-28.preview${version === 'v1' ? ';embedded_connect_beta=v2' : ''}`,
  });
};

export default initializeStripe;
