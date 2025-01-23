import {supportedLanguages} from '@/app/config/config';

interface CartItem {
  priceId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

// adds defaults
export function formatPrice(
  amount: number | null,
  language?: string,
  currency?: string
) {
  if (amount === null) {
    return 'Loading';
  }

  return new Intl.NumberFormat(language || 'en', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount / (currency === 'jpy' ? 1 : 100));
}

export function generateRandomCustomerToken() {
  return `CUST_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRandomCustomerEmail() {
  return `demo+${Math.random().toString(36).substr(2, 9)}@example.com`;
}

export function calculateOrderAmount(
  items: CartItem[],
  shippingCost: number,
  discount: number
) {
  const subtotal = items.reduce((total: number, item: CartItem) => {
    if (typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      throw new Error('Invalid item price or quantity');
    }
    return total + item.price * item.quantity;
  }, 0);
  return Math.max(0, subtotal + shippingCost - discount);
}

export function changeHexColor(baseColor: string): string {
  // Helper function to calculate brightness
  function getBrightness(hex: string): number {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  // Helper function to adjust color
  function adjustColor(color: string, amount: number): string {
    const clamp = (value: number) => Math.max(0, Math.min(255, value));

    color = color.replace(/^#/, '');
    let r = parseInt(color.slice(0, 2), 16);
    let g = parseInt(color.slice(2, 4), 16);
    let b = parseInt(color.slice(4, 6), 16);

    r = clamp(r + amount);
    g = clamp(g + amount);
    b = clamp(b + amount);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  const brightness = getBrightness(baseColor);
  const threshold = 128; // Midpoint of brightness range (0-255)
  const adjustmentAmount = 30; // Amount to lighten or darken

  if (brightness > threshold) {
    // If the color is bright, darken it for hover
    return adjustColor(baseColor, -adjustmentAmount);
  } else {
    // If the color is dark, lighten it for hover
    return adjustColor(baseColor, adjustmentAmount);
  }
}

export function getTextColor(backgroundColor: string) {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for bright backgrounds, white for dark
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function extractLocale(url: string) {
  const parsedUrl = new URL(url);
  const pathSegments = parsedUrl.pathname
    .split('/')
    .filter((segment) => segment);

  if (pathSegments.length > 0 && supportedLanguages.includes(pathSegments[0])) {
    return pathSegments[0];
  }

  return null;
}

export function internationalizeTime(time: string, locale: string): string {
  if (['en'].includes(locale)) {
    return time;
  }

  const [hours, minutesPeriod] = time.split(':');
  const minutes = minutesPeriod.slice(0, 2);
  const period = minutesPeriod.slice(2);

  let hour = parseInt(hours);
  if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
  if (period.toLowerCase() === 'am' && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

export function convertToLocale(language: string): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
    ja: 'ja-JP',
    'en-GB': 'en-GB',
    it: 'it-IT',
  };

  return localeMap[language] || language;
}
