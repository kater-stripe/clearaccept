import { CurrencyCode } from '@/constants/currencyCodes';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { formatPrice } from '@/utils/formatPrice';
import { Stripe } from 'stripe';
import { Button } from '../common/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPaymentLinkAction } from '@/app/api/payment-links/createPaymentLink';
import { deleteProduct as deleteProductAction } from '@/app/api/products/deleteProduct';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useTranslation } from 'react-i18next';
import { CopyPaymentLinkModal } from './CopyPaymentLinkModal';
import { useState } from 'react';
import { formatTime } from '@/utils/formatTime';

type ProductRowProps = {
  product: Omit<Stripe.Product, 'default_price'> & {
    default_price: Stripe.Price;
  };
};

export const ProductRow = ({ product }: ProductRowProps) => {
  const { language, chargeType, stripeSecretKey } = useDemoConfig();

  const { t } = useTranslation();

  const { account } = useDemoMerchant();

  const queryClient = useQueryClient();

  const { mutate: deleteProduct, isPending: isDeletingProduct } = useMutation({
    mutationFn: deleteProductAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['products', account?.id, stripeSecretKey, chargeType],
      });
    },
  });

  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);

  const { mutate: createPaymentLink, isPending: isCreatingPaymentLink } =
    useMutation({
      mutationFn: createPaymentLinkAction,
      onSuccess: ({ url }) => {
        setPaymentLinkUrl(url);
      },
    });

  const startTime = product.metadata.startTime
    ? new Date(`1970-01-01T${product.metadata.startTime}`)
    : null;
  const endTime = product.metadata.endTime
    ? new Date(`1970-01-01T${product.metadata.endTime}`)
    : null;

  return (
    <>
      <CopyPaymentLinkModal
        open={!!paymentLinkUrl}
        onClose={() => setPaymentLinkUrl(null)}
        url={paymentLinkUrl!}
      />
      <tr key={product.id}>
        <td className='py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 max-w-xs'>
          <div className='break-words flex items-center gap-2'>
            {product.images?.[0] && (
              <img
                src={product.images?.[0] ?? ''}
                alt={product.name}
                className='w-12 h-12 object-cover mr-2'
              />
            )}
            {product.name}
            {startTime && (
              <span className='text-gray-500 text-sm'>
                (
                {formatTime(
                  startTime.getHours(),
                  startTime.getMinutes(),
                  language,
                )}
                {endTime &&
                  ` - ${formatTime(endTime.getHours(), endTime.getMinutes(), language)}`}
                )
              </span>
            )}
          </div>
        </td>
        <td className='px-3 py-4 text-sm text-gray-500 max-w-xs'>
          <div className='truncate' title={product.description || ''}>
            {product.description}
          </div>
        </td>
        <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
          {formatPrice(
            product.default_price.unit_amount ?? 0,
            language,
            product.default_price.currency as CurrencyCode,
          )}
          {product.default_price.recurring?.interval &&
            ` ${t(`perTimeUnits.${product.default_price.recurring.interval}`)}`}
        </td>
        <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex gap-2'>
          <Button
            disabled={isCreatingPaymentLink || isDeletingProduct}
            onClick={() =>
              createPaymentLink({
                priceId: product.default_price.id,
                accountId: account!.id,
                chargeType,
                stripeSecretKey,
              })
            }
          >
            {t('dashboard.products.table.create-payment-link')}
          </Button>
          <Button
            disabled={isDeletingProduct}
            onClick={() =>
              deleteProduct({
                productId: product.id,
                accountId: account!.id,
                chargeType,
                stripeSecretKey,
              })
            }
            className='bg-red-600 hover:bg-red-500'
          >
            {t('dashboard.products.table.delete')}
          </Button>
        </td>
      </tr>
    </>
  );
};
