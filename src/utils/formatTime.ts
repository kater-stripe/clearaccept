import { type SupportedLanguage } from '@/constants/languages';

export const formatTime = (
  hour: number,
  minute: number,
  language: SupportedLanguage,
) => {
  const formattedMinute = minute.toString().padStart(2, '0');

  if (language === 'en' || language === 'en-GB') {
    return `${hour % 12 || 12}:${formattedMinute} ${hour < 12 ? 'am' : 'pm'}`;
  }

  return `${hour}:${formattedMinute}`;
};
