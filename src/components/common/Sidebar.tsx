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
  DocumentChartBarIcon,
  StarIcon,
  DocumentTextIcon,
  UsersIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  EllipsisHorizontalCircleIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo, type ComponentType, type SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  href: string;
  icon: IconComponent;
  label: string;
}

interface NavGroup {
  id: string;
  icon: IconComponent;
  label: string;
  children: (NavItem | NavGroup)[];
}

type NavElement = NavItem | NavGroup;

function isNavGroup(item: NavElement): item is NavGroup {
  return 'children' in item;
}

interface SidebarProps {
  onMobileMenuClose?: () => void;
}

/**
 * Recursively checks if a nav group or any of its children contain the given path.
 */
function groupContainsPath(group: NavGroup, currentPath: string): boolean {
  for (const child of group.children) {
    if (isNavGroup(child)) {
      if (groupContainsPath(child, currentPath)) {
        return true;
      }
    } else {
      // For nav items, check if the current path starts with the item's href
      // This handles exact matches and nested routes
      if (
        currentPath === child.href ||
        currentPath.startsWith(child.href + '/')
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Finds all group IDs that should be open based on the current path.
 */
function findActiveGroupIds(
  items: NavElement[],
  currentPath: string,
): string[] {
  const activeIds: string[] = [];

  function traverse(elements: NavElement[]) {
    for (const element of elements) {
      if (isNavGroup(element)) {
        if (groupContainsPath(element, currentPath)) {
          activeIds.push(element.id);
        }
        // Continue traversing to find nested groups
        traverse(element.children.filter(isNavGroup) as NavGroup[]);
      }
    }
  }

  traverse(items);
  return activeIds;
}

export const Sidebar = ({ onMobileMenuClose }: SidebarProps) => {
  const { language } = useDemoConfig();
  const { t } = useTranslation();
  const pathname = usePathname();
  const { account, signOut, isCapabilityActive } = useDemoMerchant();

  const navItems: NavElement[] = useMemo(
    () => [
      {
        href: `/${language}/dashboard`,
        icon: HomeIcon,
        label: t('dashboard.home.title'),
      },
      // {
      //   href: `/${language}/dashboard/products`,
      //   icon: BanknotesIcon,
      //   label: t('dashboard.products.title'),
      // },
      {
        href: `/${language}/dashboard/customers`,
        icon: UsersIcon,
        label: t('dashboard.customers.title'),
      },
      {
        id: 'payments',
        icon: CurrencyDollarIcon,
        label: t('dashboard.taking-payments.title'),
        children: [
          {
            href: `/${language}/dashboard/payments/settings`,
            icon: Cog6ToothIcon,
            label: t('dashboard.payments.settings.title'),
          },
          {
            href: `/${language}/dashboard/payments`,
            icon: CreditCardIcon,
            label: t('dashboard.payments.title'),
          },
          {
            href: `/${language}/dashboard/payments/invoices`,
            icon: DocumentTextIcon,
            label: t('dashboard.invoices.title'),
          },
          // {
          //   id: 'terminal',
          //   icon: DevicePhoneMobileIcon,
          //   label: t('dashboard.terminal.title'),
          //   children: [
          //     {
          //       href: `/${language}/dashboard/payments/terminal/settings`,
          //       icon: Cog6ToothIcon,
          //       label: t('dashboard.terminal.settings.title'),
          //     },
          //     {
          //       href: `/${language}/dashboard/payments/terminal/pos`,
          //       icon: POSIcon,
          //       label: t('dashboard.terminal.pos.title'),
          //     },
          //     // {
          //     //   href: `/${language}/dashboard/payments/terminal/shop`,
          //     //   icon: BuildingStorefrontIcon,
          //     //   label: t('dashboard.terminal.shop.title'),
          //     // },
          //   ],
          // },
          {
            href: `/${language}/dashboard/tax`,
            icon: CalculatorIcon,
            label: t('dashboard.tax.title'),
          },
        ],
      },
      {
        id: 'finance',
        icon: BriefcaseIcon,
        label: t('dashboard.finance.title'),
        children: [
          {
            href: `/${language}/dashboard/bills`,
            icon: DocumentTextIcon,
            label: t('dashboard.bills.title'),
          },
          ...(isCapabilityActive('holds_currencies.usd') ||
          isCapabilityActive('holds_currencies.gbp') ||
          isCapabilityActive('holds_currencies.eur')
            ? [
                {
                  href: `/${language}/dashboard/expenses`,
                  icon: BuildingLibraryIcon,
                  label: t('dashboard.accounts.title'),
                },
              ]
            : []),
          ...(isCapabilityActive('commercial.stripe.charge_card')
            ? [
                {
                  href: `/${language}/dashboard/cards`,
                  icon: CreditCardIcon,
                  label: t('dashboard.cards.title'),
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
        ],
      },
      {
        id: 'more',
        icon: EllipsisHorizontalCircleIcon,
        label: t('dashboard.more.title'),
        children: [
          {
            href: `/${language}/dashboard/reports`,
            icon: DocumentChartBarIcon,
            label: t('dashboard.reports.title'),
          },
          {
            href: 'https://apps-homebox.onrender.com/?redirect=/integrations/xero',
            icon: LinkIcon,
            label: t('dashboard.apps.title'),
          },
        ],
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
      ].includes(account?.identity?.country ?? '')
        ? [
            {
              href: `/${language}/dashboard/membership`,
              icon: StarIcon,
              label: t('dashboard.membership.title'),
            },
          ]
        : []),
    ],
    [language, t, isCapabilityActive, account],
  );

  // Compute which groups should be open based on the current path
  const initialOpenGroups = useMemo(() => {
    const activeIds = findActiveGroupIds(navItems, pathname);
    return activeIds.reduce(
      (acc, id) => ({ ...acc, [id]: true }),
      {} as Record<string, boolean>,
    );
  }, [navItems, pathname]);

  const [openGroups, setOpenGroups] =
    useState<Record<string, boolean>>(initialOpenGroups);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const isTopLevel = level === 0;
    const isNested = level > 1;

    return (
      <Link
        key={item.href}
        href={item.href}
        className='group'
        onClick={() => onMobileMenuClose?.()}
      >
        <button
          className={`text-left inline-flex w-full items-center gap-x-2 font-medium hover:bg-white/10 rounded-md px-4 transition duration-150 ${
            isTopLevel
              ? 'text-white text-lg py-2'
              : isNested
                ? 'text-white text-sm py-1.5'
                : 'text-white text-base py-1.5'
          }`}
        >
          <item.icon
            className={
              isTopLevel
                ? 'size-5 shrink-0'
                : isNested
                  ? 'size-3.5 shrink-0'
                  : 'size-4 shrink-0'
            }
            strokeWidth={2.5}
          />
          {item.label}
        </button>
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup, level = 0) => {
    const isOpen = openGroups[group.id] ?? false;

    // Don't render the group if it has no children
    if (group.children.length === 0) {
      return null;
    }

    const isTopLevel = level === 0;
    const isNested = level > 0;

    return (
      <div key={group.id}>
        <button
          onClick={() => toggleGroup(group.id)}
          className={`text-left inline-flex w-full items-center gap-x-2 font-medium hover:bg-white/10 rounded-md px-4 transition duration-150 ${
            isTopLevel
              ? 'text-white text-lg py-2'
              : 'text-white text-base py-1.5'
          }`}
        >
          <group.icon
            className={isTopLevel ? 'size-5 shrink-0' : 'size-4 shrink-0'}
            strokeWidth={2.5}
          />
          {group.label}
          <ChevronDownIcon
            className={`size-4 shrink-0 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            strokeWidth={2.5}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[600px]' : 'max-h-0'}`}
        >
          <div className={`${isNested ? 'pl-3' : 'pl-4'} mt-1 grid gap-y-1`}>
            {group.children.map((child) =>
              isNavGroup(child)
                ? renderNavGroup(child, level + 1)
                : renderNavItem(child, level + 1),
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='flex flex-col justify-between flex-grow'>
      <nav className='grid gap-y-2 px-4'>
        {navItems.map((item) =>
          isNavGroup(item) ? renderNavGroup(item) : renderNavItem(item),
        )}
      </nav>
      <nav className='grid gap-y-2 px-4'>
        {/* <Link
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
        </Link> */}
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
