import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import common from '@/locales/en/common.json';
import auth from '@/locales/en/auth.json';
import home from '@/locales/en/home.json';
import breathe from '@/locales/en/breathe.json';
import history from '@/locales/en/history.json';
import settings from '@/locales/en/settings.json';
import player from '@/locales/en/player.json';

// One namespace per feature (PRD section 4). English only in v1; French is the
// first planned translation, so all strings live in resource files from day one.
export const defaultNS = 'common';

export const resources = {
  en: { common, auth, home, breathe, history, settings, player },
} as const;

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: Object.keys(resources.en),
  defaultNS,
  resources,
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
