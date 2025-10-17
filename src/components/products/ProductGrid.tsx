'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { formatPrice } from '@/utils/formatPrice';
import { AddToBagButton } from './AddToBagButton';
import { useProductTranslation } from '@/hooks/useProductTranslation';
import type { ComponentProps } from 'react';
import { getProducts as getProductsAction } from '@/app/api/products/getProducts';
import { useQuery } from '@tanstack/react-query';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { formatTime } from '@/utils/formatTime';

type ProductGridProps = Omit<ComponentProps<'section'>, 'children'> & {
  titleTranslationKey: string;
  shouldOpenCart?: boolean;
};

export const ProductGrid = ({
  className,
  titleTranslationKey,
  shouldOpenCart = true,
  ...rest
}: ProductGridProps) => {
  const { t } = useTranslation();

  const { language, currency, stripeSecretKey, chargeType } = useDemoConfig();

  const { account } = useDemoMerchant();

  const {
    data: products,
    isPending,
    error,
  } = useQuery({
    queryKey: ['products', stripeSecretKey, chargeType, account?.id],
    queryFn: () =>
      getProductsAction({
        stripeSecretKey,
        chargeType,
        accountId: account!.id,
      }),
  });

  const { tp } = useProductTranslation();

  return (
    <section
      {...rest}
      className={`py-8 lg:py-12 lg:mx-auto lg:max-w-7xl ${className}`}
    >
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold tracking-tight text-gray-900'>
          {t(titleTranslationKey)}
          {products && !products.length && isPending && !error && 'Loading...'}
          {products &&
            !products.length &&
            error &&
            'Unable to fetch products. Please check the provided Stripe keys.'}
        </h2>
      </div>
      {products && products.length === 0 && (
        <p className='text-gray-500'>
          {t('storefront.products.no-products-found')}
        </p>
      )}
      <div className='grid grid-cols-1 sm:grid-cols-4 gap-8 mt-8'>
        {products?.map((product) => {
          const { name } = tp(product);

          const startTime = product.metadata.startTime
            ? new Date(`1970-01-01T${product.metadata.startTime}`)
            : null;

          const endTime = product.metadata.endTime
            ? new Date(`1970-01-01T${product.metadata.endTime}`)
            : null;

          return (
            <div
              key={product.id}
              className='group relative flex flex-col rounded-lg overflow-hidden text-black'
            >
              <div className='relative h-48 w-full md:h-64 lg:h-96'>
                <Image
                  src={
                    product.images.length > 0
                      ? product.images[0]
                      : '/img/empty-product-image.png'
                  }
                  alt={product.name}
                  fill
                  className='rounded-lg object-cover'
                />
                <div className='absolute inset-x-0 bottom-0 p-4 z-20'>
                  <AddToBagButton
                    product={product}
                    price={product.default_price}
                    shouldOpenCart={shouldOpenCart}
                    className='w-full opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    {t('addToBag.buttonText')}
                  </AddToBagButton>
                </div>
              </div>
              <div className='p-4'>
                <h3 className='text-lg lg:text-2xl font-bold text-black'>
                  {name}
                </h3>
                {startTime && (
                  <p className='text-md text-gray-500'>
                    {formatTime(
                      startTime.getHours(),
                      startTime.getMinutes(),
                      language,
                    )}
                    {endTime &&
                      ` - ${formatTime(endTime.getHours(), endTime.getMinutes(), language)}`}
                  </p>
                )}
                <p className='mt-2 text-lg text-gray-500'>
                  {formatPrice(
                    product.default_price?.unit_amount ?? 0,
                    language,
                    currency,
                  )}
                  {product.default_price?.recurring?.interval &&
                    ` ${t(`perTimeUnits.${product.default_price?.recurring.interval}`)}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
