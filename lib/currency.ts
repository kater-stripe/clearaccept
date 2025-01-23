export const countryToCurrency = (country: string) => {
  switch (country) {
    case 'US':
      return 'usd';
    case 'GB':
      return 'gbp';
    case 'AU':
      return 'aud';
    case 'SG':
      return 'sgd';
    case 'DE':
      return 'eur';
    case 'FR':
      return 'eur';
    case 'JP':
      return 'jpy';
    case 'CA':
      return 'cad';
    default:
      throw new Error('Unsupported currency: ' + country);
  }
};

export const countryToCurrencySign = (country: string) => {
  const currency = countryToCurrency(country);
  switch (currency) {
    case 'usd':
      return '$';
    case 'gbp':
      return '£';
    case 'aud':
      return 'A$';
    case 'sgd':
      return '$';
    case 'eur':
      return '€';
    case 'cad':
      return 'CA$';
    case 'jpy':
      return '¥';
    default:
      throw new Error('Unsupported currency: ' + country);
  }
};

export const currencyToCurrencySign = (currency: string) => {
  switch (currency) {
    case 'usd':
      return '$';
    case 'gbp':
      return '£';
    case 'aud':
      return 'A$';
    case 'sgd':
      return '$';
    case 'eur':
      return '€';
    case 'cad':
      return 'CA$';
    case 'jpy':
      return '¥';
    default:
      return '';
  }
};
