import type { DemoCustomer } from '@/types/demoCustomer';
import { generateRandomEmail } from '@/utils/generateRandomEmail';

export const DEFAULT_DEMO_CUSTOMER = {
  id: undefined,
  email: generateRandomEmail(),
  phone: '8888675309',
  name: 'Jenny Rosen',
} as const satisfies DemoCustomer;
