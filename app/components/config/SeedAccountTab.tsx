import {useEffect, useMemo, useState} from 'react';
import {Spinner} from '../ui';
import fetchClient from '@/app/utils/fetchClient';
import {useAccount} from '@/app/hooks/useAccount';

export const SeedAccountTab = () => {
  const [isSeeding, setIsSeeding] = useState(false);

  const [seedTransactions, setSeedTransactions] = useState(false);

  const [seedCredits, setSeedCredits] = useState(false);
  const [seedDebits, setSeedDebits] = useState(false);

  const [seedCardholders, setSeedCardholders] = useState(false);
  const [seedCards, setSeedCards] = useState(false);
  const [seedCaptures, setSeedCaptures] = useState(false);
  const [seedRefunds, setSeedRefunds] = useState(false);

  const {account} = useAccount();

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

  const [errors, setErrors] = useState<string[]>([]);

  const seed = async () => {
    setIsSeeding(true);
    setErrors([
      'It may take up to a minute to seed your account. The page will refresh automatically when seeding is complete.',
    ]);

    const promises = [];

    if (seedTransactions) {
      promises.push(fetchClient.post('/api/payment-intents/seed'));
    }

    if (seedCredits || seedDebits) {
      promises.push(
        fetchClient.post('/api/treasury/seed', {
          seedCredits,
          seedDebits,
        })
      );
    }

    if (seedCardholders) {
      promises.push(
        fetchClient.post('/api/issuing/seed', {
          seedCardholders,
          seedCards,
          seedCaptures,
          seedRefunds,
        })
      );
    }

    const responses = await Promise.allSettled(promises);

    const errors = responses
      .filter((response) => response.status === 'rejected')
      .map((response) => {
        if (response.reason instanceof Error) {
          return response.reason.message;
        }

        return 'An unknown error occurred.';
      });

    setIsSeeding(false);

    if (errors.length > 0) {
      setErrors(errors);

      return;
    }

    setErrors([]);
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-md text-gray-700">What would you like to seed?</p>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Payments</p>
        <div className="flex items-center gap-x-2">
          <input
            type="checkbox"
            id="seed-transactions"
            name="seed-transactions"
            className="accent-blurple"
            checked={seedTransactions}
            onChange={(e) => setSeedTransactions(e.target.checked)}
          />
          <label htmlFor="seed-transactions" className="text-gray-700">
            Transactions
          </label>
        </div>
      </div>
      {account?.treasury_enabled && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Treasury</p>
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              id="seed-credits"
              name="seed-credits"
              className="accent-blurple"
              checked={seedCredits}
              onChange={(e) => setSeedCredits(e.target.checked)}
            />
            <label htmlFor="seed-credits" className="text-gray-700">
              Credits
            </label>
          </div>
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              id="seed-debits"
              name="seed-debits"
              className="accent-blurple"
              checked={seedDebits}
              onChange={(e) => setSeedDebits(e.target.checked)}
            />
            <label htmlFor="seed-debits" className="text-gray-700">
              Debits
            </label>
          </div>
        </div>
      )}
      {account?.card_issuing_enabled && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Issuing</p>
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              id="seed-cardholders"
              name="seed-cardholders"
              className="accent-blurple"
              checked={seedCardholders}
              onChange={(e) => setSeedCardholders(e.target.checked)}
            />
            <label htmlFor="seed-cardholders" className="text-gray-700">
              Cardholders
            </label>
          </div>
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              id="seed-cards"
              name="seed-cards"
              className="accent-blurple"
              checked={seedCards}
              onChange={(e) => setSeedCards(e.target.checked)}
              disabled={!seedCardholders}
            />
            <label htmlFor="seed-cards" className="text-gray-700">
              Cards
            </label>
          </div>
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              id="seed-captures"
              name="seed-captures"
              className="accent-blurple"
              checked={seedCaptures}
              onChange={(e) => setSeedCaptures(e.target.checked)}
              disabled={!seedCards}
            />
            <label htmlFor="seed-captures" className="text-gray-700">
              Captures
            </label>
          </div>
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              id="seed-refunds"
              name="seed-refunds"
              className="accent-blurple"
              checked={seedRefunds}
              onChange={(e) => setSeedRefunds(e.target.checked)}
              disabled={!seedCaptures}
            />
            <label htmlFor="seed-refunds" className="text-gray-700">
              Refunds
            </label>
          </div>
        </div>
      )}
      {errors.length > 0 && (
        <p className="flex flex-col text-sm text-red-500">
          {errors.map((error, index) => (
            <span key={index}>{error}</span>
          ))}
        </p>
      )}
      <button
        disabled={isSeeding || !hasSelectedSeedingOption}
        onClick={seed}
        className="mt-2 flex w-full items-center justify-center rounded-md border border-blurple bg-blurple px-6 py-2 text-white transition-colors duration-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSeeding ? <Spinner className="text-white" /> : 'Start seeding'}
      </button>
    </div>
  );
};
