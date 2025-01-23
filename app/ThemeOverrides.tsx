'use client';

import {useConfigContext} from '@/app/contexts/ConfigContext';
import {changeHexColor, getTextColor} from '@/app/utils/helpers';

export default function ThemeOverrides() {
  const {settings} = useConfigContext();

  return (
    <style>{`
      :root {
        --purple: ${settings?.primaryColor};
        --purple-hover: ${changeHexColor(settings?.primaryColor)};
        --background: ${settings?.secondaryColor};
        --background-hover: ${changeHexColor(settings?.secondaryColor)};
        --button-color: ${getTextColor(settings?.primaryColor)};
        --text-color: ${getTextColor(settings?.secondaryColor)};
      }
    `}</style>
  );
}
