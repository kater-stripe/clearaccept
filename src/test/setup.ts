import '@testing-library/jest-dom';

// Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useParams: () => ({ language: 'en' }),
  usePathname: () => '/en/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
  headers: jest.fn(() => ({ get: jest.fn() })),
}));

// react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Stripe Connect JS
jest.mock('@stripe/connect-js/pure', () => ({
  loadConnectAndInitialize: jest.fn(),
}));

jest.mock('@stripe/react-connect-js', () => ({
  ConnectComponentsProvider: ({ children }: { children: React.ReactNode }) => children,
  ConnectCapitalOverview: () => null,
  ConnectCapitalFinancing: () => null,
  ConnectCapitalFinancingPromotion: () => null,
  ConnectAccountOnboarding: () => null,
}));
