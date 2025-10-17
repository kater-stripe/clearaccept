import { useEffect, type ComponentProps } from 'react';
import { Card } from '../common/Card';
import { useTranslation } from 'react-i18next';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { formatTime } from '@/utils/formatTime';
import { useQuery } from '@tanstack/react-query';
import { getProducts as getProductsAction } from '@/app/api/products/getProducts';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useState } from 'react';
import { PayinsModal } from './PayinsModal';
import { useCart } from '@/context/CartContext';
import { useHandleCallbacks } from '../checkout/HandleCallbacks';

type ScheduleProps = ComponentProps<'div'>;

export const Schedule = (props: ScheduleProps) => {
  const { t } = useTranslation();
  const { language, stripeSecretKey, chargeType } = useDemoConfig();
  const { account } = useDemoMerchant();
  const { clearCart, addItem } = useCart();
  const { hasCallbackParameters } = useHandleCallbacks();
  const [isPayinsModalOpen, setIsPayinsModalOpen] = useState(
    hasCallbackParameters,
  );

  const { data: products } = useQuery({
    queryKey: ['products', account?.id, stripeSecretKey, chargeType],
    queryFn: () =>
      getProductsAction({
        accountId: account!.id,
        stripeSecretKey,
        chargeType,
      }),
  });

  const serviceProducts = products?.filter(
    (product) => product.metadata?.category === 'service',
  );

  return (
    <Card {...props}>
      <PayinsModal
        open={isPayinsModalOpen}
        onClose={() => setIsPayinsModalOpen(false)}
      />
      <div className='mb-4 flex justify-between items-end'>
        <h2 className='text-lg font-semibold'>
          {t('dashboard.home.todays-schedule')}
        </h2>
        <span className='text-md text-gray-500'>
          {new Date().toLocaleDateString(language, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </span>
      </div>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-2'>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className='h-[80px] text-gray-500 text-sm'>
              {formatTime(9 + index, 0, language)}
            </div>
          ))}
        </div>
        <div className='relative col-span-10 pt-2'>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className='h-[80px] border-t border-gray-200' />
          ))}
          {serviceProducts
            ?.filter((product) => {
              const startTime = product.metadata?.startTime;
              const endTime = product.metadata?.endTime;

              if (!startTime || !endTime) {
                return false;
              }

              const startTimeDate = new Date(`1970-01-01T${startTime}`);
              const endTimeDate = new Date(`1970-01-01T${endTime}`);

              // Ensures the start time and end time are between 9:00 and 18:00.
              if (startTimeDate.getHours() < 9 || endTimeDate.getHours() > 18) {
                return false;
              }

              // Ensures the start time is before the end time.
              if (startTimeDate.getHours() >= endTimeDate.getHours()) {
                return false;
              }

              return true;
            })
            .map((product) => {
              const startTime = product.metadata.startTime;
              const endTime = product.metadata.endTime;

              const startTimeDate = new Date(`1970-01-01T${startTime}`);
              const endTimeDate = new Date(`1970-01-01T${endTime}`);

              const startTimeInMinutes =
                startTimeDate.getHours() * 60 + startTimeDate.getMinutes();

              const endTimeInMinutes =
                endTimeDate.getHours() * 60 + endTimeDate.getMinutes();

              const scheduleStartMinutes = 9 * 60;
              const minutesPerPixel = 80 / 60;

              const heightInPixels =
                (endTimeInMinutes - startTimeInMinutes) * minutesPerPixel;

              const topInPixels =
                (startTimeInMinutes - scheduleStartMinutes) * minutesPerPixel +
                8;

              return (
                <button
                  key={product.id}
                  className='absolute w-full bg-brand-secondary text-white rounded-md p-2 hover:bg-brand-secondary-accent flex flex-col items-start'
                  style={{
                    top: `${topInPixels}px`,
                    height: `${heightInPixels}px`,
                  }}
                  onClick={() => {
                    setIsPayinsModalOpen(true);

                    clearCart();

                    addItem(product, product.default_price);
                  }}
                >
                  <span>
                    {formatTime(
                      startTimeDate.getHours(),
                      startTimeDate.getMinutes(),
                      language,
                    )}{' '}
                    -{' '}
                    {formatTime(
                      endTimeDate.getHours(),
                      endTimeDate.getMinutes(),
                      language,
                    )}
                  </span>
                  <span className='font-semibold'>{product.name}</span>
                </button>
              );
            })}
        </div>
      </div>
    </Card>
  );
};
