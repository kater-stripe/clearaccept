'use client';

import {useConfigContext} from '@/app/contexts/ConfigContext';
import {changeHexColor, getTextColor} from '@/app/utils/helpers';

export default function ThemeOverrides() {
  const {settings} = useConfigContext();

  return (
    <style>{`
      :root {
        --primary: ${settings?.primaryColor};
        --primary-foreground: ${getTextColor(settings?.primaryColor)};
        --secondary: ${settings?.secondaryColor};
        --secondary-foreground: ${getTextColor(settings?.secondaryColor)};
      }
    `}</style>
  );
}
