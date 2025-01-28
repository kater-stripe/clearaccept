'use client';

import {useSession} from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
  Home as HomeIcon,
  Calendar as CalendarIcon,
  Wallet as WalletIcon,
  Coins as CoinsIcon,
  Landmark as LandmarkIcon,
  Users as UsersIcon,
  LucideIcon,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import PoseRed from '@/public/pose_red.svg';
import {useTranslation} from 'react-i18next';
import {useConfigContext} from '../contexts/ConfigContext';
import {useAccount} from '../hooks/useAccount';

interface NavigationMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  paths: string[];
  countryFilter?: string[];
}

const navigationMenuItems: NavigationMenuItem[] = [
  {
    label: 'navigation.home',
    href: '/',
    icon: HomeIcon,
    paths: [],
  },
  {
    label: 'navigation.classes',
    href: '/classes',
    icon: CalendarIcon,
    paths: [],
  },
  {
    label: 'navigation.instructors',
    href: '/instructors',
    icon: UsersIcon,
    paths: [],
  },
  {
    label: 'navigation.payments',
    href: '/payments',
    icon: WalletIcon,
    paths: [],
  },
  {
    label: 'navigation.payouts',
    href: '/payouts',
    icon: CoinsIcon,
    paths: [],
  },
  {
    label: 'navigation.finances',
    href: '/finances',
    icon: LandmarkIcon,
    paths: ['/finances/cards'],
    countryFilter: [
      'US',
      'AT',
      'BE',
      'HR',
      'CY',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PT',
      'SK',
      'SI',
      'ES',
      'GB',
    ],
  },
];

const Nav = () => {
  const {t} = useTranslation();
  const pathname = usePathname();
  const {data: session} = useSession();
  const {settings} = useConfigContext();

  const accountID = session?.user?.stripeAccount?.id;
  const country = session?.user?.stripeAccount?.country!;

  const displayIssuing =
    session?.user?.stripeAccount?.capabilities?.card_issuing;
  const displayCapital = session?.user?.stripeAccount?.capabilities?.treasury;

  return (
    <div className="fixed z-40 h-screen w-64 bg-primary p-3">
      <Image
        className="p-5"
        src={settings?.customLogo || '/pose_red.svg'}
        alt="Pose"
        width={150}
        height={23}
      />
      <nav>
        <ul className="flex-col items-start space-x-0">
          {navigationMenuItems
            .filter(
              (item) =>
                !item.countryFilter || item.countryFilter.includes(country)
            )
            .filter(
              (item) =>
                item.label !== 'navigation.finances' ||
                displayIssuing ||
                displayCapital
            )
            .map((item) => (
              <li key={item.label} className="p-1">
                <Link href={`/${settings?.language}${item.href}`}>
                  <Button
                    className={`w-full justify-start text-lg text-white hover:bg-white ${
                      pathname === item.href || item.paths.includes(pathname)
                        ? 'bg-white bg-opacity-15 hover:bg-opacity-15'
                        : 'bg-none hover:bg-opacity-10'
                    }`}
                  >
                    <item.icon className="mr-2 h-5 w-5" color="white" />{' '}
                    {t(item.label)}
                  </Button>
                </Link>
              </li>
            ))}
          <li>
            <Link href={`/${settings?.language}/settings`}>
              <Button
                className={`fixed bottom-5 justify-start text-lg text-white hover:bg-white ${
                  pathname.startsWith('/settings')
                    ? 'bg-white bg-opacity-15 hover:bg-opacity-15'
                    : 'bg-none hover:bg-opacity-10'
                }`}
              >
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarImage src="/avatar.png" alt="profile" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>{' '}
                <span title={accountID}>
                  {t('dashboard.settings.my_studio')}
                </span>
              </Button>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Nav;
