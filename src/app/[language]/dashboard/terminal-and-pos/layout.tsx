'use client';

import { Button } from '@/components/common/Button';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { type PropsWithChildren } from 'react';
import Link from 'next/link';
import { useDemoConfig } from '@/context/DemoConfigContext';

type TerminalAndPOSLayoutProps = PropsWithChildren;

const TerminalAndPOSLayout = ({ children }: TerminalAndPOSLayoutProps) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { language } = useDemoConfig();

  return (
    <div>
      <div className='flex gap-2'>
        <Link href={`/${language}/dashboard/terminal-and-pos/terminal`}>
          <Button
            className={`border hover:border-brand-primary-accent ${
              pathname === `/${language}/dashboard/terminal-and-pos/terminal`
                ? 'border-brand-primary'
                : 'bg-white text-gray-500 border-gray-500 hover:text-white'
            }`}
          >
            {t('dashboard.terminal-and-pos.terminal.tab')}
          </Button>
        </Link>
        <Link href={`/${language}/dashboard/terminal-and-pos/pos`}>
          <Button
            className={`border hover:border-brand-primary-accent ${
              pathname === `/${language}/dashboard/terminal-and-pos/pos`
                ? 'border-brand-primary'
                : 'bg-white text-gray-500 border-gray-500 hover:text-white'
            }`}
          >
            {t('dashboard.terminal-and-pos.pos.tab')}
          </Button>
        </Link>
      </div>
      <div className='mt-4'>{children}</div>
    </div>
  );
};

export default TerminalAndPOSLayout;
