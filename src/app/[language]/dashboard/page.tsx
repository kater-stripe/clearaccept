'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const DashboardPage = () => {
  const { language } = useDemoConfig();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${language}/dashboard/wallet`);
  }, [language]);

  return null;
};

export default DashboardPage;
