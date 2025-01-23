export type CountryType = 'US' | 'DE' | 'FR' | 'AU';

export const Countries: Array<{country: CountryType; label: string}> = [
  {label: 'countries.australia', country: 'AU'},
  {label: 'countries.france', country: 'FR'},
  {label: 'countries.germany', country: 'DE'},
  {label: 'countries.united_states', country: 'US'},
];

export type LocaleType =
  | 'bg-BG'
  | 'cs-CZ'
  | 'da-DK'
  | 'de-DE'
  | 'el-GR'
  | 'en-GB'
  | 'en-US'
  | 'en-CA' // not a real locale.
  | 'en-IE' // not a real locale.
  | 'en-IN' // not a real locale.
  | 'en-NZ' // not a real locale.
  | 'en-SG' // not a real locale.
  | 'en-AU' // not a real locale.
  | 'es-419'
  | 'es-ES'
  | 'et-EE'
  | 'fi-FI'
  | 'fil-PH'
  | 'fr-CA'
  | 'fr-FR'
  | 'hr-HR'
  | 'hu-HU'
  | 'id-ID'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KR'
  | 'lt-LT'
  | 'lv-LV'
  | 'ms-MY'
  | 'mt-MT'
  | 'nb-NO'
  | 'nl-NL'
  | 'pl-PL'
  | 'pt-BR'
  | 'pt-PT'
  | 'ro-RO'
  | 'sk-SK'
  | 'sl-SI'
  | 'sv-SE'
  | 'th-TH'
  | 'tr-TR'
  | 'vi-VN'
  | 'zh-Hans'
  | 'zh-Hant-HK'
  | 'en-HK' // not a real locale, but used to show HK English
  | 'zh-Hant-TW';

// Anything in here should be added to `translateLocale` in app/hooks/useConnect.ts
export const fakeLocales: ReadonlyArray<LocaleType> = [
  'en-CA',
  'en-HK',
  'en-IE',
  'en-IN',
  'en-NZ',
  'en-SG',
  'en-AU',
];

// https://docs.google.com/spreadsheets/d/1-Bu7w2kuBYPXinuTdxrt3T8scrNaMxL8elSJr9aiVtE/edit#gid=0
export const Locales: Array<{locale: LocaleType; label: string}> = [
  {label: 'Australia (English)', locale: 'en-AU'},
  {label: 'Brazil (Português)', locale: 'pt-BR'},
  {label: 'Bulgarian (Български)', locale: 'bg-BG'},
  {label: 'Canada (English)', locale: 'en-CA'},
  {label: 'Canada (Français)', locale: 'fr-CA'},
  {label: 'Chinese Simplified (简体中文)', locale: 'zh-Hans'},
  {label: 'Croatian (hrvatski)', locale: 'hr-HR'},
  {label: 'Czech (čeština)', locale: 'cs-CZ'},
  {label: 'Danish (dansk)', locale: 'da-DK'},
  {label: 'Estonian  (eesti)', locale: 'et-EE'},
  {label: 'Filipino (Filipino)', locale: 'fil-PH'},
  {label: 'Finnish (suomi)', locale: 'fi-FI'},
  {label: 'France (Français)', locale: 'fr-FR'},
  {label: 'German (Deutsch)', locale: 'de-DE'},
  {label: 'Greek (ελληνικά)', locale: 'el-GR'},
  {label: 'Hong Kong (中文)', locale: 'zh-Hant-HK'},
  {label: 'Hong Kong (English)', locale: 'en-HK'},
  {label: 'Hungarian (magyar)', locale: 'hu-HU'},
  {label: 'India (English)', locale: 'en-IN'},
  {label: 'Indonesia (Bahasa Indonesia)', locale: 'id-ID'},
  {label: 'Ireland (English)', locale: 'en-IE'},
  {label: 'Italian (Italiano)', locale: 'it-IT'},
  {label: 'Japanese (日本語)', locale: 'ja-JP'},
  {label: 'Korean (한국어)', locale: 'ko-KR'},
  {label: 'Latin America (Español)', locale: 'es-419'},
  {label: 'Latvian (latviešu)', locale: 'lv-LV'},
  {label: 'Lithuanian (lietuvių)', locale: 'lt-LT'},
  {label: 'Malaysia (Melayu)', locale: 'ms-MY'},
  {label: 'Malta (Malti)', locale: 'mt-MT'},
  {label: 'Netherlands (Nederlands)', locale: 'nl-NL'},
  {label: 'New Zealand (English)', locale: 'en-NZ'},
  {label: 'Norway (Norsk bokmål)', locale: 'nb-NO'},
  {label: 'Poland (polski)', locale: 'pl-PL'},
  {label: 'Portugal (Português)', locale: 'pt-PT'},
  {label: 'Romania (română)', locale: 'ro-RO'},
  {label: 'Singapore (English)', locale: 'en-SG'},
  {label: 'Slovakia (slovenčina)', locale: 'sk-SK'},
  {label: 'Slovenian (slovenščina)', locale: 'sl-SI'},
  {label: 'Spanish (Español)', locale: 'es-ES'},
  {label: 'Swedish (svenska)', locale: 'sv-SE'},
  {label: 'Taiwan (臺灣華語)', locale: 'zh-Hant-TW'},
  {label: 'Thai (ไทย)', locale: 'th-TH'},
  {label: 'Turkish (Türkçe)', locale: 'tr-TR'},
  {label: 'United Kingdom (English)', locale: 'en-GB'},
  {label: 'United States (English)', locale: 'en-US'},
  {label: 'Vietnamese (Tiếng Việt)', locale: 'vi-VN'},
];

export interface Settings {
  locale: LocaleType;
}
