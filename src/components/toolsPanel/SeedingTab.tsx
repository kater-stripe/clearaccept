import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Checkbox } from './Checkbox';
import { Button } from './Button';
import { seedTransactions as seedTransactionsAction } from '@/app/api/payment-intents/seedTransactions';
import { useMutation } from '@tanstack/react-query';
import { seedIssuing as seedIssuingAction } from '@/app/api/issuing/seedIssuing';
import { seedFinancialAccountTransactions as seedFinancialAccountTransactionsAction } from '@/app/api/financial-accounts/seedFinancialAccountTransactions';
import { useDemoConfig } from '@/context/DemoConfigContext';

type SeedingTabProps = Omit<ComponentProps<'div'>, 'children'>;

export const SeedingTab = ({ className, ...rest }: SeedingTabProps) => {
  const { account } = useDemoMerchant();
  const { stripeSecretKey, language, chargeType } = useDemoConfig();

  const [seedTransactions, setSeedTransactions] = useState(false);

  const [seedCredits, setSeedCredits] = useState(false);
  const [seedDebits, setSeedDebits] = useState(false);

  const [seedCardholders, setSeedCardholders] = useState(false);
  const [seedCards, setSeedCards] = useState(false);
  const [seedCaptures, setSeedCaptures] = useState(false);
  const [seedRefunds, setSeedRefunds] = useState(false);

  const { isCapabilityActive } = useDemoMerchant();

  useEffect(() => {
    if (seedCardholders) {
      return;
    }

    setSeedCards(false);
    setSeedCaptures(false);
    setSeedRefunds(false);
  }, [seedCardholders]);

  useEffect(() => {
    if (seedCards) {
      return;
    }

    setSeedCaptures(false);
    setSeedRefunds(false);
  }, [seedCards]);

  useEffect(() => {
    if (seedCaptures) {
      return;
    }

    setSeedRefunds(false);
  }, [seedCaptures]);

  const hasSelectedSeedingOption = useMemo(() => {
    return seedTransactions || seedCredits || seedDebits || seedCardholders;
  }, [seedTransactions, seedCredits, seedDebits, seedCardholders]);

  const {
    mutateAsync: startSeedingTransactions,
    isPending: isSeedingTransactions,
    error: seedingTransactionsError,
  } = useMutation({
    mutationFn: seedTransactionsAction,
  });

  const {
    mutateAsync: startSeedingIssuing,
    isPending: isSeedingIssuing,
    error: seedingIssuingError,
  } = useMutation({
    mutationFn: seedIssuingAction,
  });

  const {
    mutateAsync: startSeedingFinancialAccountTransactions,
    isPending: isSeedingFinancialAccountTransactions,
    error: seedingFinancialAccountTransactionsError,
  } = useMutation({
    mutationFn: seedFinancialAccountTransactionsAction,
  });

  const errors = useMemo(() => {
    return [
      seedingTransactionsError?.message,
      seedingIssuingError?.message,
      seedingFinancialAccountTransactionsError?.message,
    ].filter(Boolean);
  }, [
    seedingTransactionsError,
    seedingIssuingError,
    seedingFinancialAccountTransactionsError,
  ]);

  return (
    <div className={`flex flex-col gap-y-2 ${className}`} {...rest}>
      <p className='text-md text-gray-700'>What would you like to seed?</p>
      <div className='flex flex-col gap-y-2'>
        <p className='text-sm font-medium text-gray-700'>Payments</p>
        <Checkbox
          label='Transactions'
          checked={seedTransactions}
          onChange={(seedTransactions) => setSeedTransactions(seedTransactions)}
        />
      </div>
      {isCapabilityActive('treasury') && (
        <div className='mt-2 flex flex-col gap-y-2'>
          <p className='text-sm font-medium text-gray-700'>Treasury</p>
          <Checkbox
            label='Credits'
            checked={seedCredits}
            onChange={(seedCredits) => setSeedCredits(seedCredits)}
          />
          <Checkbox
            label='Debits'
            checked={seedDebits}
            onChange={(seedDebits) => setSeedDebits(seedDebits)}
          />
        </div>
      )}
      {isCapabilityActive('card_issuing') && (
        <div className='my-2 flex flex-col gap-y-2'>
          <p className='text-sm font-medium text-gray-700'>Issuing</p>
          <Checkbox
            label='Cardholders'
            checked={seedCardholders}
            onChange={(seedCardholders) => setSeedCardholders(seedCardholders)}
          />
          <Checkbox
            label='Cards'
            checked={seedCards}
            onChange={(seedCards) => setSeedCards(seedCards)}
            disabled={!seedCardholders}
          />
          <Checkbox
            label='Captures'
            checked={seedCaptures}
            onChange={(seedCaptures) => setSeedCaptures(seedCaptures)}
            disabled={!seedCards}
          />
          <Checkbox
            label='Refunds'
            checked={seedRefunds}
            onChange={(seedRefunds) => setSeedRefunds(seedRefunds)}
            disabled={!seedCaptures}
          />
        </div>
      )}
      {errors.length > 0 && (
        <p className='flex flex-col text-sm text-red-500'>
          {errors.map((error, index) => (
            <span key={index}>{error}</span>
          ))}
        </p>
      )}
      <Button
        className='w-full'
        onClick={async () => {
          await Promise.all([
            seedTransactions
              ? startSeedingTransactions({
                  accountId: account!.id,
                  stripeSecretKey,
                  language,
                  chargeType,
                })
              : null,
            seedCredits || seedDebits
              ? startSeedingFinancialAccountTransactions({
                  accountId: account!.id,
                  stripeSecretKey,
                  language,
                  seedCredits,
                  seedDebits,
                })
              : null,
            seedCardholders || seedCards || seedCaptures || seedRefunds
              ? startSeedingIssuing({
                  accountId: account!.id,
                  stripeSecretKey,
                  language,
                  seedCardholders,
                  seedCards,
                  seedCaptures,
                  seedRefunds,
                })
              : null,
          ]);

          if (errors.length === 0) {
            window.location.reload();
          }
        }}
        disabled={
          isSeedingTransactions ||
          isSeedingIssuing ||
          isSeedingFinancialAccountTransactions ||
          !hasSelectedSeedingOption
        }
      >
        {isSeedingTransactions ||
        isSeedingIssuing ||
        isSeedingFinancialAccountTransactions ? (
          <LoadingSpinner className='size-5' strokeWidth={3} />
        ) : (
          'Start seeding'
        )}
      </Button>
    </div>
  );
};
