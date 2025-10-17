import { CurrencyCode } from '@/constants/currencyCodes';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { getBalances as getBalancesAction } from '@/app/api/balances/getBalances';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CurrencyPill } from '../financial-account/CurrencyPill';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { CurrencyInput } from '../common/CurrencyInput';
import { formatPrice } from '@/utils/formatPrice';
import { useState } from 'react';
import { createIssuingBalanceTransfer as createIssuingBalanceTransferAction } from '@/app/api/balance-transfers/createIssuingBalanceTransfer';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { LoadingSpinner } from '../common/LoadingSpinner';

type IssuingBalanceProps = {
  balance: {
    currency: string;
    amount: number;
  };
};

export const IssuingBalance = ({ balance }: IssuingBalanceProps) => {
  const { stripeSecretKey, language } = useDemoConfig();
  const { account } = useDemoMerchant();
  const { t } = useTranslation();

  const { data: balances } = useQuery({
    queryKey: ['balances', account?.id, stripeSecretKey],
    queryFn: () =>
      getBalancesAction({
        accountId: account!.id,
        stripeSecretKey,
      }),
  });

  const availableBalance = balances?.available?.find(
    (b) => b.currency === balance.currency,
  )?.amount;

  const [amountToTransfer, setAmountToTransfer] = useState(0);

  const queryClient = useQueryClient();

  const {
    mutate: createIssuingBalanceTransfer,
    isPending: isCreatingIssuingBalanceTransfer,
    error: creatingIssuingBalanceTransferError,
  } = useMutation({
    mutationFn: createIssuingBalanceTransferAction,
    onSuccess: async ({ message }) => {
      if (message) {
        throw new Error(message);
      }

      await queryClient.invalidateQueries({
        queryKey: ['balances', account?.id, stripeSecretKey],
      });

      await queryClient.invalidateQueries({
        queryKey: ['account', account?.id, stripeSecretKey],
      });
    },
  });

  return (
    <div className='flex items-end justify-between gap-4'>
      <CurrencyPill
        key={balance.currency}
        currency={balance.currency as CurrencyCode}
        amount={balance.amount}
        size='lg'
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();

          createIssuingBalanceTransfer({
            amount: amountToTransfer,
            currency: balance.currency as CurrencyCode,
            accountId: account!.id,
            stripeSecretKey,
          });
        }}
      >
        <div className='flex gap-x-2 items-end'>
          <CurrencyInput
            label={t('dashboard.expenses.issuing-topups.transfer-amount', {
              amount: formatPrice(
                availableBalance ?? 0,
                language,
                balance.currency as CurrencyCode,
              ),
            })}
            currency={balance.currency as CurrencyCode}
            onChange={(value) => setAmountToTransfer(value ?? 0)}
            required={true}
            max={availableBalance ?? 0}
            min={0}
          />
          <Button
            className='h-[2.7rem] min-w-30'
            disabled={
              !amountToTransfer ||
              isCreatingIssuingBalanceTransfer ||
              amountToTransfer > (availableBalance ?? 0)
            }
            type='submit'
          >
            {isCreatingIssuingBalanceTransfer ? (
              <LoadingSpinner className='size-4' strokeWidth={3} />
            ) : (
              <>
                {t('dashboard.expenses.issuing-topups.transfer')}
                <ArrowRightIcon className='size-4' strokeWidth={2.5} />
              </>
            )}
          </Button>
        </div>
        {creatingIssuingBalanceTransferError && (
          <p className='text-red-500 text-sm mt-1'>
            {t(creatingIssuingBalanceTransferError.message)}
          </p>
        )}
      </form>
    </div>
  );
};
