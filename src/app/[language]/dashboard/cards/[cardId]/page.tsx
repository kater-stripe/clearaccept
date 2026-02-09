'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { CardDetail } from '@/components/issuing/CardDetail';

const CardDetailPage = () => {
  const { cardId, language } = useParams<{
    cardId: string;
    language: string;
  }>();
  const router = useRouter();
  const { language: configLanguage } = useDemoConfig();

  const lang = language || configLanguage || 'en';

  return (
    <CardDetail
      cardId={cardId}
      onBack={() => router.push(`/${lang}/dashboard/cards`)}
    />
  );
};

export default CardDetailPage;

