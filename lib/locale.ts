import type {LocaleType, Settings} from '@/types/settings';

let defaultLocale: LocaleType = 'en-US';
switch (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY!) {
  case 'GB':
    defaultLocale = 'en-GB';
    break;
  case 'AU':
    defaultLocale = 'en-AU';
    break;
  case 'US':
    defaultLocale = 'en-US';
  default:
    break;
}

export const DefaultLocale: LocaleType = defaultLocale;
