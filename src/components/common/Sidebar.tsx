'use client';

import { POSIcon } from '@/components/pos/POSIcon';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import {
  ArrowLeftEndOnRectangleIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  HomeIcon,
  UserIcon,
  WalletIcon,
  Square3Stack3DIcon,
  CalculatorIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  DocumentChartBarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  onMobileMenuClose?: () => void;
}

export const Sidebar = ({ onMobileMenuClose }: SidebarProps) => {
  const { language } = useDemoConfig();
  const { t } = useTranslation();
  const { account, signOut, isCapabilityActive } = useDemoMerchant();

  const navItems = [
    {
      href: `/${language}/dashboard`,
      icon: HomeIcon,
      label: t('dashboard.home.title'),
    },
    {
      href: `/${language}/dashboard/products`,
      icon: BanknotesIcon,
      label: t('dashboard.products.title'),
    },
    {
      href: `/${language}/dashboard/terminal-and-pos/terminal`,
      icon: POSIcon,
      label: t('dashboard.terminal-and-pos.title'),
    },
    {
      href: `/${language}/dashboard/payments`,
      icon: CreditCardIcon,
      label: t('dashboard.payments.title'),
    },
    {
      href: `/${language}/dashboard/tax`,
      icon: CalculatorIcon,
      label: t('dashboard.tax.title'),
    },
    ...(isCapabilityActive('treasury') || isCapabilityActive('card_issuing')
      ? [
          {
            href: `/${language}/dashboard/expenses`,
            icon: BuildingLibraryIcon,
            label: t('dashboard.expenses.title'),
          },
        ]
      : []),
    {
      href: `/${language}/dashboard/capital`,
      icon: Square3Stack3DIcon,
      label: t('dashboard.capital.title'),
    },
    {
      href: `/${language}/dashboard/payouts`,
      icon: WalletIcon,
      label: t('dashboard.payouts.title'),
    },
    {
      href: `/${language}/dashboard/reports`,
      icon: DocumentChartBarIcon,
      label: t('dashboard.reports.title'),
    },
    {
      href: `/${language}/dashboard/apps`,
      icon: LinkIcon,
      label: t('dashboard.apps.title'),
    },
    /**
     * Supported Balance Pay countries.
     */
    ...([
      'AT',
      'BE',
      'BG',
      'CY',
      'CZ',
      'DE',
      'DK',
      'EE',
      'ES',
      'FI',
      'FR',
      'GR',
      'HR',
      'HU',
      'IE',
      'IT',
      'LT',
      'LU',
      'LV',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SE',
      'SI',
      'SK',
      'NO',
      'CA',
      'CH',
      'GB',
      'US',
    ].includes(
      (account?.object === 'account'
        ? account.country
        : account?.identity?.country) ?? '',
    )
      ? [
          {
            href: `/${language}/dashboard/membership`,
            icon: StarIcon,
            label: t('dashboard.membership.title'),
          },
        ]
      : []),
  ];

  return (
    <div className='flex flex-col justify-between flex-grow'>
      <nav className='grid gap-y-2 px-4'>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className='group'
            onClick={() => onMobileMenuClose?.()}
          >
            <button className='text-left inline-flex w-full items-center gap-x-2 text-white font-medium text-lg group-hover:bg-white/10 rounded-md px-4 py-2 transition duration-0.15'>
              <item.icon className='size-5 shrink-0' strokeWidth={2.5} />
              {item.label}
            </button>
          </Link>
        ))}
      </nav>
      <nav className='grid gap-y-2 px-4'>
        <Link
          href={`/${language}/storefront/${account?.id}`}
          onClick={() => onMobileMenuClose?.()}
          target='_blank'
        >
          <button className='text-left inline-flex w-full items-center gap-x-2 text-white font-medium text-lg hover:bg-white/10 rounded-md px-4 py-2 transition duration-0.15'>
            <ArrowTopRightOnSquareIcon
              className='size-5 shrink-0'
              strokeWidth={2.5}
            />
            {t('dashboard.open-storefront')}
          </button>
        </Link>
        <Link
          href={`/${language}/dashboard/account`}
          onClick={() => onMobileMenuClose?.()}
        >
          <button className='text-left inline-flex w-full items-center gap-x-2 text-white font-medium text-lg hover:bg-white/10 rounded-md px-4 py-2 transition duration-0.15'>
            <UserIcon className='size-5 shrink-0' strokeWidth={2.5} />
            {t('dashboard.account.title')}
          </button>
        </Link>
        <button
          onClick={() => {
            signOut();
            onMobileMenuClose?.();
          }}
          className='text-left inline-flex w-full items-center gap-x-2 text-white font-medium text-lg hover:bg-white/10 rounded-md px-4 py-2 transition duration-0.15'
        >
          <ArrowLeftEndOnRectangleIcon
            className='size-5 shrink-0'
            strokeWidth={2.5}
          />
          {t('sign-out.button.text')}
        </button>
      </nav>
    </div>
  );
};
