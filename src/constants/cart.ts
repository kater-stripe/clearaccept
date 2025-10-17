import type { Cart } from '@/types/cart';

export const DEFAULT_CART = {
  items: [],
  isCartOpen: false,
} as const satisfies Cart;
