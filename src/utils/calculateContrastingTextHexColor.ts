import { hexColorToRGB } from './hexColorToRGB';

export const calculateContrastingTextHexColor = (hexColor: string) => {
  const [r, g, b] = hexColorToRGB(hexColor);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#1f2937' : '#f3f4f6';
};
