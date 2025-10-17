import { hexColorToRGB } from './hexColorToRGB';

const THRESHOLD = 128 as const;
const POSITIVE_ADJUSTMENT_AMOUNT = 30 as const;

const clampRGBValue = (value: number) => Math.max(0, Math.min(255, value));

const getHexColorBrightness = (hexColor: string) => {
  const [r, g, b] = hexColorToRGB(hexColor);

  return (r * 299 + g * 587 + b * 114) / 1000;
};

const adjustHexColor = (hexColor: string, amount: number) => {
  let [r, g, b] = hexColorToRGB(hexColor);

  r = clampRGBValue(r + amount);
  g = clampRGBValue(g + amount);
  b = clampRGBValue(b + amount);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const clampHexColorBrightness = (hexColor: string) => {
  const brightness = getHexColorBrightness(hexColor);

  if (brightness > THRESHOLD) {
    return adjustHexColor(hexColor, -POSITIVE_ADJUSTMENT_AMOUNT);
  }

  return adjustHexColor(hexColor, POSITIVE_ADJUSTMENT_AMOUNT);
};
