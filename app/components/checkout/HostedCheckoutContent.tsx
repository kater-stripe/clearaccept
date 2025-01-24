import fetchClient from '@/app/utils/fetchClient';
import {useEffect} from 'react';
import {Spinner} from '../ui';
import {useTranslation} from 'react-i18next';
import {useRouter} from 'next/navigation';

export function HostedCheckoutContent() {
  const {t} = useTranslation();
  const router = useRouter();

  useEffect(() => {
    fetchClient
      .post<null, {data: {url: string}}>('/api/checkout-session', {
        isEmbedded: false,
      })
      .then(({data: {url}}) => {
        router.push(url);
      })
      .catch((error) => {
        console.error('Error fetching client secret:', error);
      });
  }, [fetchClient]);

  return (
    <div id="checkout">
      <div className="flex flex-col items-center py-8">
        <Spinner />
        <p className="text-text-color mt-4 text-lg font-semibold">
          {t('loading')}
        </p>
      </div>
    </div>
  );
}
