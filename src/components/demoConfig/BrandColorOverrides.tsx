'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { calculateContrastingTextHexColor } from '@/utils/calculateContrastingTextHexColor';
import { clampHexColorBrightness } from '@/utils/clampHexColorBrightness';

export const BrandColorOverrides = () => {
  const { primaryColor, secondaryColor } = useDemoConfig();

  return (
    <style>
      {`
      :root {
        --brand-primary: ${primaryColor};
        --brand-primary-accent: ${clampHexColorBrightness(primaryColor)};
        --brand-secondary: ${secondaryColor};
        --brand-secondary-accent: ${clampHexColorBrightness(secondaryColor)};
        --brand-primary-contrasting-text: ${calculateContrastingTextHexColor(primaryColor)};
        --brand-secondary-contrasting-text: ${calculateContrastingTextHexColor(secondaryColor)};
      }
    `}
    </style>
  );
};
