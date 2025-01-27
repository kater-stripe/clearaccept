export const countryToCurrency = (country: string) => {
  switch (country) {
    case 'AU':
      return 'aud';
    case 'AT':
    case 'BE':
    case 'CY':
    case 'EE':
    case 'FI':
    case 'FR':
    case 'DE':
    case 'GR':
    case 'IE':
    case 'IT':
    case 'LV':
    case 'LT':
    case 'LU':
    case 'MT':
    case 'NL':
    case 'PT':
    case 'SK':
    case 'SI':
    case 'ES':
      return 'eur';
    case 'BR':
      return 'brl';
    case 'BG':
      return 'bgn';
    case 'CA':
      return 'cad';
    case 'HR':
      return 'hrk';
    case 'CZ':
      return 'czk';
    case 'DK':
      return 'dkk';
    case 'GH':
      return 'ghs';
    case 'GI':
      return 'gip';
    case 'HK':
      return 'hkd';
    case 'HU':
      return 'huf';
    case 'ID':
      return 'idr';
    case 'JP':
      return 'jpy';
    case 'KE':
      return 'kes';
    case 'LI':
      return 'chf';
    case 'MY':
      return 'myr';
    case 'MX':
      return 'mxn';
    case 'NZ':
      return 'nzd';
    case 'NG':
      return 'ngn';
    case 'NO':
      return 'nok';
    case 'PL':
      return 'pln';
    case 'RO':
      return 'ron';
    case 'SG':
      return 'sgd';
    case 'ZA':
      return 'zar';
    case 'SE':
      return 'sek';
    case 'CH':
      return 'chf';
    case 'TH':
      return 'thb';
    case 'AE':
      return 'aed';
    case 'GB':
      return 'gbp';
    case 'US':
      return 'usd';
    default:
      return 'eur';
  }
};

export const countryToCurrencySign = (country: string) => {
  const currency = countryToCurrency(country);
  return currencyToCurrencySign(currency);
};

export const currencyToCurrencySign = (currency: string) => {
  switch (currency) {
    case 'usd':
    case 'cad':
    case 'aud':
    case 'nzd':
    case 'sgd':
    case 'hkd':
      return '$';
    case 'gbp':
      return '£';
    case 'eur':
      return '€';
    case 'jpy':
      return '¥';
    case 'brl':
      return 'R$';
    case 'bgn':
      return 'лв';
    case 'hrk':
      return 'kn';
    case 'czk':
      return 'Kč';
    case 'dkk':
      return 'kr';
    case 'ghs':
      return '₵';
    case 'gip':
      return '£';
    case 'huf':
      return 'Ft';
    case 'idr':
      return 'Rp';
    case 'kes':
      return 'KSh';
    case 'chf':
      return 'Fr';
    case 'myr':
      return 'RM';
    case 'mxn':
      return '$';
    case 'ngn':
      return '₦';
    case 'nok':
      return 'kr';
    case 'pln':
      return 'zł';
    case 'ron':
      return 'lei';
    case 'zar':
      return 'R';
    case 'sek':
      return 'kr';
    case 'thb':
      return '฿';
    case 'aed':
      return 'د.إ';
    default:
      return '';
  }
};
