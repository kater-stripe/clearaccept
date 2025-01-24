'use client';

import React from 'react';
import Link from 'next/link';
import Container from './Container';
import {ChevronRight} from 'lucide-react';
import {countryToCurrencySign, currencyToCurrencySign} from '@/lib/currency';
import {useSession} from 'next-auth/react';
import {useTranslation} from 'react-i18next';
import {useConfigContext} from '../contexts/ConfigContext';

const BalanceWidget = () => {
  const {t} = useTranslation();
  const {settings} = useConfigContext();

  // Localization for currency
  const {data: session} = useSession();
  const sign = currencyToCurrencySign(
    session?.user.stripeAccount?.country ||
      process.env.NEXT_PUBLIC_DEFAULT_COUNTRY!
  );

  return (
    <Container className="px-5">
      <div className="space-y-1">
        <div className="flex flex-row justify-between">
          <div>
            <h1 className="font-bold text-subdued">
              {t('components.recent_payments.recent')}
            </h1>
          </div>
          <div>
            <Link
              href={`/${settings?.language}/payments`}
              className="flex flex-row items-center"
            >
              <div className="text-sm font-bold text-primary">
                {t('components.recent_payments.view_all')}
              </div>
              <ChevronRight color="#221b35" size={18} className="mt-[1px]" />
            </Link>
          </div>
        </div>
        <div>
          <ul>
            {session?.user.charges.map((charge, i) => (
              <li
                key={i}
                className="flex flex-row justify-between text-subdued"
              >
                <div>{charge.description}</div>
                <div>
                  {currencyToCurrencySign(charge.currency)}
                  {(
                    charge.amount / (charge.currency !== 'jpy' ? 100 : 1)
                  ).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
};

export default BalanceWidget;
