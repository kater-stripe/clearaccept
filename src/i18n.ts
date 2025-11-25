import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_DEMO_CONFIG } from './constants/demoConfig';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from './constants/languages';

import en from '@/../public/locales/en.json';
import fr from '@/../public/locales/fr.json';
import es from '@/../public/locales/es.json';
import de from '@/../public/locales/de.json';
import it from '@/../public/locales/it.json';
import ja from '@/../public/locales/ja.json';
import enGB from '@/../public/locales/en-GB.json';
import zh from '@/../public/locales/zh.json';

i18n.use(initReactI18next).init({
  fallbackLng: DEFAULT_DEMO_CONFIG.language,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: en,
    },
    fr: {
      translation: fr,
    },
    es: {
      translation: es,
    },
    de: {
      translation: de,
    },
    it: {
      translation: it,
    },
    ja: {
      translation: ja,
    },
    'en-GB': {
      translation: enGB,
    },
    zh: {
      translation: zh,
    }
  } satisfies Record<SupportedLanguage, { translation: Record<string, string | object> }>,
});

export default i18n;
