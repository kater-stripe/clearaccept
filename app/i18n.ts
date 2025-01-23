import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { supportedLanguages, defaultDemoSettings } from './config/config'

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: defaultDemoSettings.language,
    supportedLngs: supportedLanguages,
    // debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: require('/public/locales/en.json'),
      },
      fr: {
        translation: require('/public/locales/fr.json'),
      },
      es: {
        translation: require('/public/locales/es.json'),
      },
      de: {
        translation: require('/public/locales/de.json'),
      },
      ja: {
        translation: require('/public/locales/ja.json'),
      },
      it: {
        translation: require('/public/locales/it.json'),
      },
      'en-GB': {
        translation: require('/public/locales/en-GB.json'),
      },
    },
  })

export default i18n
