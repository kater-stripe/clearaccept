import { useDemoConfig } from '@/context/DemoConfigContext';
import { Stripe } from 'stripe';
import { Button } from '../common/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useTranslation } from 'react-i18next';
import { deleteTerminalLocation as deleteTerminalLocationAction } from '@/app/api/terminal/locations/deleteTerminalLocation';

type LocationRowProps = {
  location: Stripe.Terminal.Location;
};

export const LocationRow = ({ location }: LocationRowProps) => {
  const { stripeSecretKey, chargeType } = useDemoConfig();

  const { t } = useTranslation();

  const { account } = useDemoMerchant();

  const queryClient = useQueryClient();

  const {
    mutate: deleteTerminalLocation,
    isPending: isDeletingTerminalLocation,
  } = useMutation({
    mutationFn: deleteTerminalLocationAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'terminal-locations',
          account?.id,
          stripeSecretKey,
          chargeType,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'terminal-readers',
          location.id,
          stripeSecretKey,
          chargeType,
        ],
      });
    },
  });

  return (
    <tr>
      <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6'>
        {location.display_name}
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
        <p>{location.address.line1}</p>
        {location.address.line2 && <p>{location.address.line2}</p>}
        <p>
          {location.address.city}, {location.address.state}{' '}
          {location.address.postal_code}
        </p>
        <p>{location.address.country}</p>
      </td>
      <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex gap-2'>
        <Button
          disabled={isDeletingTerminalLocation}
          onClick={() =>
            deleteTerminalLocation({
              locationId: location.id,
              stripeSecretKey,
              accountId: account!.id,
              chargeType,
            })
          }
          className='bg-red-600 hover:bg-red-500'
        >
          {t('dashboard.terminal-and-pos.terminal.locations-table.delete')}
        </Button>
      </td>
    </tr>
  );
};
