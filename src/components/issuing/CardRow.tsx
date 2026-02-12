'use client';

import type Stripe from 'stripe';
import { useRouter } from 'next/navigation';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { CardStatusBadge } from './CardStatusBadge';
import { CreditCardIcon } from '@heroicons/react/24/outline';

type CardRowProps = {
  card: Stripe.Issuing.Card;
  onClick: (card: Stripe.Issuing.Card) => void;
  faLast4Map?: Record<string, string>;
};

export const CardRow = ({ card, onClick, faLast4Map = {} }: CardRowProps) => {
  const router = useRouter();
  const { language } = useDemoConfig();
  // @ts-expect-error - financial_account_v2 is not in the type definition
  const faId = card.financial_account_v2 as string | undefined;
  const faLast4 = faId ? faLast4Map[faId] : undefined;

  const handleFaBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (faId) {
      router.push(`/${language}/dashboard/financial-accounts/${faId}`);
    }
  };

  return (
    <tr
      className='hover:bg-gray-50 cursor-pointer transition-colors'
      onClick={() => onClick(card)}
    >
      <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6'>
        <div className='flex items-center gap-3'>
          <CreditCardIcon className='size-5 text-gray-400' />
          <div>
            <p className='font-medium text-gray-900'>
              •••• {card.last4}
            </p>
            <p className='text-gray-500 text-xs capitalize'>{card.type}</p>
          </div>
        </div>
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
        {card.cardholder?.name || '-'}
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500 uppercase'>
        {card.currency}
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
        {faId ? (
          <button
            onClick={handleFaBadgeClick}
            className='inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium hover:bg-blue-200 transition-colors'
          >
            {faLast4 ? `FA ••${faLast4}` : 'FA'}
          </button>
        ) : (
          <span className='text-gray-400'>Issuing balance</span>
        )}
      </td>
      <td className='whitespace-nowrap px-3 py-4 text-sm'>
        <CardStatusBadge status={card.status} />
      </td>
    </tr>
  );
};

