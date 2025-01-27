import {defaultDemoSettings} from '@/app/config/config';

export const withFallbackHeaders = (headerList: Headers) => {
  const headers = {
    stripeSecretKey:
      (headerList.get('demo-stripesecretkey') === 'undefined'
        ? undefined
        : headerList.get('demo-stripesecretkey')) ||
      process.env.STRIPE_SECRET_KEY ||
      undefined,
    stripePublishableKey:
      headerList.get('demo-stripepublishablekey') || undefined,
    currency: headerList.get('demo-currency') || undefined,
    language: headerList.get('demo-language') || undefined,
    email: headerList.get('demo-email') || undefined,
    customer: headerList.get('demo-customer') || undefined,
    applicationFee: headerList.get('demo-applicationfee') || undefined,
  };

  return {
    ...defaultDemoSettings,
    ...headers,
  };
};
