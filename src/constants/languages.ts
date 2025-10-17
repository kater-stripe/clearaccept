export const SUPPORTED_LANGUAGES = [
  'en',
  'fr',
  'es',
  'de',
  'ja',
  'it',
  'en-GB',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
