import type { DemoMerchant } from '@/types/demoMerchant';
import { generateRandomEmail } from '@/utils/generateRandomEmail';

export const DEFAULT_DEMO_MERCHANT = {
  account: null,
  email: generateRandomEmail(),
} as const satisfies DemoMerchant;
