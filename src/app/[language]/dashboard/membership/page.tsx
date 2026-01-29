'use client';

import { getProducts as getProductsAction } from '@/app/api/products/getProducts';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { CurrencyCode } from '@/constants/currencyCodes';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useProductTranslation } from '@/hooks/useProductTranslation';
import { formatPrice } from '@/utils/formatPrice';
import { CreditCardIcon } from '@heroicons/react/24/solid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getBalancePaySubscription as getBalancePaySubscriptionAction } from '@/app/api/subscriptions/getBalancePaySubscription';
import { getBalances as getBalancesAction } from '@/app/api/balances/getBalances';
import { createBalancePaySubscription as createBalancePaySubscriptionAction } from '@/app/api/subscriptions/createBalancePaySubscription';

const MembershipPage = () => {
  const { t } = useTranslation();
  const { tp } = useProductTranslation();

  const { stripeSecretKey, language } = useDemoConfig();

  const { account, email } = useDemoMerchant();

  const { data: products } = useQuery({
    queryKey: ['products', stripeSecretKey],
    queryFn: () =>
      getProductsAction({
        stripeSecretKey,
      }),
  });

  const membershipProduct = products?.find(
    (product) => product.metadata.category === 'membership',
  );

  const error =
    products !== undefined && membershipProduct === undefined
      ? 'Unable to fetch membership product. Please ensure at least one product on the platform has the metadata field `category` set to `membership`.'
      : undefined;

  const {
    data: balancePaySubscription,
    isLoading: isLoadingBalancePaySubscription,
  } = useQuery({
    queryKey: ['balancePaySubscription', stripeSecretKey, email],
    queryFn: () =>
      getBalancePaySubscriptionAction({
        stripeSecretKey,
        email: email!,
      }),
    enabled: !!email,
  });

  const { data: balances } = useQuery({
    queryKey: ['balances', stripeSecretKey, account?.id],
    queryFn: () =>
      getBalancesAction({
        stripeSecretKey,
        accountId: account?.id,
      }),
    enabled: !!account?.id,
  });

  const queryClient = useQueryClient();

  const { mutate: createBalancePaySubscription, isPending: isEnrolling } =
    useMutation({
      mutationFn: async (
        ...params: Parameters<typeof createBalancePaySubscriptionAction>
      ) => {
        const response = await createBalancePaySubscriptionAction(...params);

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['balancePaySubscription', stripeSecretKey, email],
          }),
          queryClient.invalidateQueries({
            queryKey: ['balances', stripeSecretKey, account?.id],
          }),
        ]);

        return response;
      },
    });

  const defaultCurrency = (account?.defaults?.currency ?? 'usd') as CurrencyCode;

  const isEnrolled = balancePaySubscription?.status === 'active';

  const availableBalance =
    balances?.available?.find((balance) => balance.currency === defaultCurrency)
      ?.amount ?? 0;

  const hasSufficientBalance =
    availableBalance > (membershipProduct?.default_price.unit_amount ?? 0);

  const isLoading =
    !membershipProduct || isLoadingBalancePaySubscription || !balances;

  return (
    <div className='flex flex-col gap-4'>
      {error ? (
        <div className='rounded-md border border-red-600 text-red-600 bg-red-100 p-4'>
          {error}
        </div>
      ) : (
        <>
          {!isLoading ? (
            <div className='grid gap-y-4'>
              <h1 className='text-3xl font-bold'>
                {tp(membershipProduct).name}
              </h1>
              <div>
                <Card className='grid w-full grid-cols-12 gap-5 rounded-md px-4 py-6'>
                  <div className='col-span-2'>
                    <p className='font-medium text-secondary'>
                      {t('dashboard.membership.price')}
                    </p>
                  </div>
                  <div className='col-span-10'>
                    <p className='font-bold'>
                      {formatPrice(
                        membershipProduct.default_price.unit_amount ?? 0,
                        language,
                        defaultCurrency,
                      )}{' '}
                      {t(
                        `perTimeUnits.${membershipProduct.default_price.recurring?.interval}`,
                      )}
                    </p>
                  </div>
                  <div className='col-span-2 flex flex-col justify-center'>
                    <p className='font-medium text-secondary'>
                      {t('dashboard.membership.features')}
                    </p>
                  </div>
                  <div className='col-span-10'>
                    <ul className='list-disc pl-5'>
                      {tp(membershipProduct).marketing_features.map(
                        (feature) => (
                          <li key={feature}>{feature}</li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div className='col-span-2 flex flex-col justify-center'>
                    <p className='font-medium text-secondary'>
                      {t('dashboard.membership.payment_method')}
                    </p>
                  </div>
                  <div className='col-span-10'>
                    <div className='max-w-xs'>
                      <Select
                        label={t('dashboard.membership.payment_method')}
                        hideLabel={true}
                        options={[
                          {
                            value: 'stripe_balance',
                            label: t('dashboard.membership.stripe_balance'),
                          },
                        ]}
                        disabled={true}
                        value={'stripe_balance'}
                      />
                    </div>
                  </div>
                </Card>
                <p className='mt-2 text-sm text-gray-500'>
                  {t('dashboard.membership.disclaimer', {
                    enroll_now: t('dashboard.membership.enroll_now'),
                    amount: formatPrice(
                      membershipProduct.default_price.unit_amount ?? 0,
                      language,
                      defaultCurrency,
                    ),
                    interval: t(
                      `dashboard.membership.perTimeUnits.${membershipProduct.default_price.recurring?.interval}`,
                    ),
                  })}
                </p>
              </div>
              <div>
                <Button
                  disabled={isEnrolled || isEnrolling || !hasSufficientBalance}
                  onClick={() =>
                    createBalancePaySubscription({
                      stripeSecretKey,
                      email: email!,
                      accountId: account!.id,
                    })
                  }
                >
                  <CreditCardIcon className='size-5 text-white' />
                  {isEnrolling
                    ? t('dashboard.membership.enrolling')
                    : isEnrolled
                      ? t('dashboard.membership.enrolled')
                      : t('dashboard.membership.enroll_now')}
                </Button>
                {!isEnrolled && !isEnrolling && !hasSufficientBalance && (
                  <p className='mt-1 text-sm text-red-500'>
                    {t('dashboard.membership.insufficient_balance', {
                      balance: formatPrice(
                        availableBalance,
                        language,
                        defaultCurrency,
                      ),
                    })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className='animate h-16 animate-pulse rounded-md bg-gray-200' />
              <div className='animate h-48 animate-pulse rounded-md bg-gray-200' />
              <div className='animate h-16 animate-pulse rounded-md bg-gray-200' />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MembershipPage;
