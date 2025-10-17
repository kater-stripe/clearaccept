'use client';

import { getProducts as getProductsAction } from '@/app/api/products/getProducts';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CreateProductModal } from '@/components/product/CreateProductModal';
import { ProductRow } from '@/components/product/ProductRow';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ProductsAndPricingPage = () => {
  const { stripeSecretKey, chargeType, canCreateObjects } = useDemoConfig();
  const { account } = useDemoMerchant();

  const { t } = useTranslation();

  const { data: products, isPending: isProductsLoading } = useQuery({
    queryKey: ['products', account?.id, stripeSecretKey, chargeType],
    queryFn: () =>
      getProductsAction({
        accountId: account!.id,
        stripeSecretKey,
        chargeType,
      }),
    enabled: !!account,
  });

  const [isCreateProductModalOpen, setIsCreateProductModalOpen] =
    useState(false);

  return (
    <>
      <CreateProductModal
        open={isCreateProductModalOpen}
        onClose={() => setIsCreateProductModalOpen(false)}
      />
      <Card>
        <div className='flow-root'>
          <div className='-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
            <div className='inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8'>
              <div className='overflow-hidden shadow-sm ring-1 ring-black/5 sm:rounded-lg'>
                <table className='min-w-full divide-y divide-gray-300'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th
                        scope='col'
                        className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6'
                      >
                        {t('dashboard.products.table.name')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                      >
                        {t('dashboard.products.table.description')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                      >
                        {t('dashboard.products.table.price')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
                      >
                        {t('dashboard.products.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 bg-white'>
                    {isProductsLoading && (
                      <tr>
                        <td colSpan={4}>
                          <div className='flex items-center justify-center p-4'>
                            <LoadingSpinner className='size-6' />
                          </div>
                        </td>
                      </tr>
                    )}
                    {products?.map((product) => (
                      <ProductRow key={product.id} product={product} />
                    ))}
                    <tr>
                      <td colSpan={4}>
                        <div className='flex items-center justify-center p-4'>
                          <div className='relative group'>
                            <Button
                              disabled={!canCreateObjects}
                              onClick={() => setIsCreateProductModalOpen(true)}
                            >
                              {t('dashboard.products.table.create-product')}
                            </Button>
                            {!canCreateObjects && (
                              <span className='absolute left-full ml-2 top-1/2 -translate-y-1/2 w-max max-w-xs p-2 py-1 px-2 text-xs text-dark bg-white border rounded-md shadow-lg invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10'>
                                Use custom keys or direct charges to enable
                                product creation.
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ProductsAndPricingPage;
