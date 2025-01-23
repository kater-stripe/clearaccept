'use client';

import React from 'react';
import Link from 'next/link';
import Container from './Container';
import {ChevronRight} from 'lucide-react';
import {countryToCurrencySign} from '@/lib/currency';
import {useSession} from 'next-auth/react';
import {useTranslation} from 'react-i18next';
import {useConfigContext} from '../contexts/ConfigContext';

const BalanceWidget = () => {
  const {t} = useTranslation();
  const {settings} = useConfigContext();

  // Localization for currency
  const {data: session} = useSession();
  const sign = countryToCurrencySign(
    session?.user.stripeAccount?.country ||
      process.env.NEXT_PUBLIC_DEFAULT_COUNTRY!
  );

  return (
    <Container className="px-5">
      <div className="flex flex-row justify-between space-y-1">
        <div>
          <h1 className="font-bold text-subdued">
            {t('components.balance.total')}
          </h1>
          <div className="text-xl font-bold">{sign}1,532</div>
        </div>
        <div>
          <Link
            href={`/${settings?.language}/payouts`}
            className="flex flex-row items-center"
          >
            <div className="text-sm font-bold text-primary">
              {t('components.balance.payout')}
            </div>
            <ChevronRight color="#221b35" size={18} className="mt-[1px]" />
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default BalanceWidget;
