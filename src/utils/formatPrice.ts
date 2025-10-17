import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';

export const formatPrice = (
  amount: number | string,
  language: SupportedLanguage,
  currencyCode: CurrencyCode,
) => {
  if (typeof amount === 'string') {
    return amount;
  }

  return new Intl.NumberFormat(language || 'en', {
    style: 'currency',
    currency: currencyCode.toUpperCase() || 'USD',
  }).format(amount / (currencyCode === 'jpy' ? 1 : 100));
};
