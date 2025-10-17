import type { Stripe } from 'stripe';

export type Item = {
  product: Stripe.Product;
  price: Stripe.Price;
  quantity: number;
};
