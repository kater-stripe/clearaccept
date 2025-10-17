'use client';

import { useCart } from '@/context/CartContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useRouter } from 'next/navigation';
import type { Stripe } from 'stripe';
import { Button, ButtonProps } from '../common/Button';

type AddToBagButtonProps = Omit<ButtonProps, 'onClick'> & {
  product: Stripe.Product;
  price: Stripe.Price;
  shouldRedirectToCheckout?: boolean;
  shouldOpenCart?: boolean;
};

export const AddToBagButton = ({
  product,
  price,
  shouldRedirectToCheckout = false,
  shouldOpenCart = true,
  children,
  ...rest
}: AddToBagButtonProps) => {
  const { openCart, addItem } = useCart();
  const { language } = useDemoConfig();
  const router = useRouter();

  if (!product) {
    return null;
  }

  const handleAddToBag = () => {
    addItem(product, price);

    if (shouldRedirectToCheckout) {
      router.push(`/${language}/checkout`);
      return;
    }

    if (shouldOpenCart) {
      openCart();
    }
  };

  return (
    <Button onClick={handleAddToBag} {...rest}>
      {children}
    </Button>
  );
};
