import {createContext} from 'react';

import type {LocaleType, Settings} from '@/types/settings';
import {DefaultLocale} from '@/lib/locale';

export const defaultSettings: Settings = {
  locale: DefaultLocale,
};

export interface SettingsContextType {
  locale: LocaleType;
  handleUpdate: (settings: Settings) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  ...defaultSettings,
  handleUpdate: (settings: Settings) => {},
});
