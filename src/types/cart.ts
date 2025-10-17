import type { Item } from './item';

export type Cart = {
  items: Item[];
  isCartOpen: boolean;
};
