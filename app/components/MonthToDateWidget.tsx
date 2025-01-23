'use client';

import React from 'react';
import Container from './Container';
import {Badge} from '@/components/ui/badge';
import {SparkLineChart} from '@mui/x-charts/SparkLineChart';
import {countryToCurrencySign} from '@/lib/currency';
import {useSession} from 'next-auth/react';
import {useTranslation} from 'react-i18next';

const MonthToDateWidget = () => {
  const {t} = useTranslation();

  // Localization for currency
  const {data: session} = useSession();
  const sign = countryToCurrencySign(
    session?.user.stripeAccount?.country ||
      process.env.NEXT_PUBLIC_DEFAULT_COUNTRY!
  );

  return (
    <Container className="px-5">
      <div className="flex flex-row justify-between gap-10">
        <div className="min-w-[110px] space-y-1">
          <h1 className="font-bold text-subdued">
            {t('components.month_to_date.month_to_date')}
          </h1>
          <div className="flex flex-row items-center space-x-2">
            <div className="text-xl font-bold">{sign}13.3k</div>
            <Badge className="h-6 rounded-md border-success-border bg-success pb-0 pl-1 pr-1 pt-0 text-success-foreground">
              +7.5%
            </Badge>
          </div>
        </div>
        <div className="relative w-full">
          <div className={`absolute right-0 w-full max-w-[250px]`}>
            <SparkLineChart
              data={[0, 10, 25, 20, 15, 5, 30, 40, 55, 40, 45, 55]}
              height={55}
              colors={['#DEDDE1']}
              curve="natural"
              className="right-0"
            />
          </div>
          <div className={`absolute right-0 w-full max-w-[250px]`}>
            <SparkLineChart
              data={[5, 10, 15, 0, 20, 25, 50, 40, 35, 30, 45, 55]}
              height={55}
              colors={['#221B35']}
              curve="natural"
              className="right-0"
            />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default MonthToDateWidget;
