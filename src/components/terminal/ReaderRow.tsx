import { useDemoConfig } from '@/context/DemoConfigContext';
import { Stripe } from 'stripe';
import { Button } from '../common/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useTranslation } from 'react-i18next';
import { deleteReader as deleteReaderAction } from '@/app/api/terminal/readers/deleteReader';

type ReaderRowProps = {
  reader: Stripe.Terminal.Reader;
};

export const ReaderRow = ({ reader }: ReaderRowProps) => {
  const { stripeSecretKey, chargeType } = useDemoConfig();

  const { t } = useTranslation();

  const { account } = useDemoMerchant();

  const queryClient = useQueryClient();

  const { mutate: deleteReader, isPending: isDeletingReader } = useMutation({
    mutationFn: deleteReaderAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'terminal-readers',
          reader.location,
          stripeSecretKey,
          chargeType,
        ],
      });
    },
  });

  return (
    <tr>
      <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6'>
        {reader.label}
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
        {reader.serial_number}
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
        <div className='flex items-center gap-2'>
          {reader.status === 'online' ? (
            <div className='w-4 h-4 bg-green-600 rounded-full' />
          ) : (
            <div className='w-4 h-4 bg-red-600 rounded-full' />
          )}
          <p>
            {reader.status === 'online'
              ? t('dashboard.terminal-and-pos.terminal.readers-table.online')
              : t('dashboard.terminal-and-pos.terminal.readers-table.offline')}
          </p>
        </div>
      </td>
      <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex gap-2'>
        <Button
          disabled={isDeletingReader}
          onClick={() =>
            deleteReader({
              readerId: reader.id,
              accountId: account!.id,
              stripeSecretKey,
              chargeType,
            })
          }
          className='bg-red-600 hover:bg-red-500'
        >
          {t('dashboard.terminal-and-pos.terminal.readers-table.delete')}
        </Button>
      </td>
    </tr>
  );
};
