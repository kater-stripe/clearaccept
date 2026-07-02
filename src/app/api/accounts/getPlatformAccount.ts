'use server';

// Map the currency env var to an approximate platform country so we can avoid
// calling the v1 stripe.accounts.retrieve(null) endpoint (which emits a "use v2"
// warning on every page load). The platform account has no v2 equivalent.
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  gbp: 'GB',
  eur: 'DE',
  usd: 'US',
  aud: 'AU',
  cad: 'CA',
  sgd: 'SG',
  nzd: 'NZ',
  chf: 'CH',
  nok: 'NO',
  sek: 'SE',
  dkk: 'DK',
  mxn: 'MX',
  brl: 'BR',
  jpy: 'JP',
  hkd: 'HK',
};

export const getPlatformAccount = async ({}: {
  stripeSecretKey?: string;
} = {}) => {
  const default_currency = (process.env.CURRENCY ?? 'usd').toLowerCase();
  const country = CURRENCY_TO_COUNTRY[default_currency] ?? 'US';

  return { default_currency, country };
};
