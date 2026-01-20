'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { Button } from '../common/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCustomer as deleteCustomerAction } from '@/app/api/customers/deleteCustomer';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useTranslation } from 'react-i18next';
import type { Stripe } from 'stripe';

type CustomerRowProps = {
  customer: Stripe.Customer;
};

export const CustomerRow = ({ customer }: CustomerRowProps) => {
  const { chargeType, stripeSecretKey } = useDemoConfig();
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const queryClient = useQueryClient();

  const { mutate: deleteCustomer, isPending: isDeletingCustomer } = useMutation(
    {
      mutationFn: deleteCustomerAction,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['customers', account?.id, stripeSecretKey, chargeType],
        });
      },
    },
  );

  const address = customer.address;
  const addressString = address
    ? [
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
      ]
        .filter(Boolean)
        .join(', ')
    : '-';

  return (
    <tr key={customer.id}>
      <td className='py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 max-w-xs'>
        <div className='break-words'>{customer.name || '-'}</div>
      </td>
      <td className='px-3 py-4 text-sm text-gray-500 max-w-xs'>
        <div className='truncate' title={customer.email || ''}>
          {customer.email || '-'}
        </div>
      </td>
      <td className='px-3 py-4 text-sm text-gray-500 max-w-xs'>
        <div className='truncate'>{customer.phone || '-'}</div>
      </td>
      <td className='px-3 py-4 text-sm text-gray-500 max-w-xs'>
        <div className='truncate' title={addressString}>
          {addressString}
        </div>
      </td>
      <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6'>
        <Button
          disabled={isDeletingCustomer}
          onClick={() =>
            deleteCustomer({
              customerId: customer.id,
              accountId: account!.id,
              chargeType,
              stripeSecretKey,
            })
          }
          className='bg-red-600 hover:bg-red-500 text-white'
        >
          {t('dashboard.customers.table.delete')}
        </Button>
      </td>
    </tr>
  );
};
