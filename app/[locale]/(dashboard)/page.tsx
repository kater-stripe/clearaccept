'use client';

import Schedule from '@/app/components/Schedule';
import BalanceWidget from '@/app/components/BalanceWidget';
import RecentPaymentsWidget from '@/app/components/RecentPaymentsWidget';
import MonthToDateWidget from '@/app/components/MonthToDateWidget';
import CustomersWidget from '@/app/components/CustomersWidget';
import {useTranslation} from 'react-i18next';
import {useSession} from 'next-auth/react';

export default function Dashboard() {
  const {t} = useTranslation();
  const {data: session} = useSession();

  return (
    <>
      <h1 className="text-3xl font-bold">
        {t('dashboard.welcome', {name: session?.user.name})}
      </h1>
      <div className="flex flex-row items-start space-x-5">
        <div className="min-w-[700px] flex-1">
          <Schedule />
        </div>
        <div className="w-[30%] min-w-[300px] space-y-4">
          <BalanceWidget />
          <RecentPaymentsWidget />
          <h2 className="pt-4 text-lg font-bold">
            {t('dashboard.performance')}
          </h2>
          <MonthToDateWidget />
          <CustomersWidget />
        </div>
      </div>
    </>
  );
}
