'use client';

import { DEFAULT_CART } from '@/constants/cart';
import type { Cart } from '@/types/cart';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useDemoConfig } from './DemoConfigContext';
import { useLocalStorage } from 'usehooks-ts';
import type { Item } from '@/types/item';
import { usePathname } from 'next/navigation';
import { useDemoMerchant } from './DemoMerchantContext';

const CartContext = createContext<
  Cart & {
    addItem: (product: Item['product'], price: Item['price']) => void;
    setItemQuantity: (item: Item, quantity: number) => void;
    removeItem: (item: Item) => void;
    openCart: () => void;
    clearCart: () => void;
    hasSubscriptionInCart: boolean;
    subtotal: number;
    closeCart: () => void;
    cartRecentlyUpdated: boolean;
  }
>({
  ...DEFAULT_CART,
  addItem: () => {},
  setItemQuantity: () => {},
  removeItem: () => {},
  openCart: () => {},
  clearCart: () => {
    const key = `${process.env.NEXT_PUBLIC_DEMO_NAME}-cart`;

    window.localStorage.setItem(key, JSON.stringify(DEFAULT_CART));

    window.dispatchEvent(new StorageEvent('local-storage', { key }));
  },
  hasSubscriptionInCart: false,
  subtotal: 0,
  closeCart: () => {},
  cartRecentlyUpdated: false,
});

type CartProviderProps = PropsWithChildren<{
  itemsOverride?: Item[];
}>;

export const CartProvider = ({
  children,
  itemsOverride,
}: CartProviderProps) => {
  const { demoName } = useDemoConfig();

  const pathname = usePathname();

  const { account } = useDemoMerchant();

  const cartName = useMemo(() => {
    const dashboardOrStorefront = pathname.includes('/storefront/')
      ? 'storefront'
      : 'dashboard';

    return `${demoName}-${dashboardOrStorefront}-${account?.id}-cart`;
  }, [pathname, account?.id]);

  const [cart, setCart] = useLocalStorage<Cart>(cartName, DEFAULT_CART);

  const hasSubscriptionInCart = useMemo(() => {
    return cart.items.some(({ price }) => price.recurring !== null);
  }, [cart.items]);

  const addItem = useCallback(
    (product: Item['product'], price: Item['price']) => {
      setCart(({ items, ...previousCartRest }) => {
        let newItems = [...items];

        const existingItem = newItems.find(
          ({ price: existingPrice }) => existingPrice.id === price.id,
        );

        // Update quantity if item exists, otherwise add new item
        if (existingItem !== undefined) {
          existingItem.quantity += 1;
        } else {
          newItems.push({
            product,
            price,
            quantity: 1,
          });
        }

        return {
          ...previousCartRest,
          items: newItems,
        };
      });
    },
    [setCart],
  );

  const setItemQuantity = useCallback(
    (item: Item, quantity: number) => {
      setCart(({ items, ...previousCartRest }) => {
        const existingItem = items.find(
          ({ price: existingPrice }) => existingPrice.id === item.price.id,
        );

        if (existingItem === undefined) {
          return {
            ...previousCartRest,
            items,
          };
        }

        existingItem.quantity = quantity;

        return {
          ...previousCartRest,
          items,
        };
      });
    },
    [setCart],
  );

  const removeItem = useCallback(
    (itemToBeRemoved: Item) => {
      setCart(({ items, ...previousCartRest }) => {
        const existingItemIndex = items.findIndex(
          ({ price }) => price.id === itemToBeRemoved.price.id,
        );

        if (existingItemIndex === -1) {
          return {
            ...previousCartRest,
            items,
          };
        }

        items.splice(existingItemIndex, 1);

        return {
          ...previousCartRest,
          items,
        };
      });
    },
    [setCart],
  );

  const clearCart = useCallback(() => {
    setCart(DEFAULT_CART);
  }, [setCart]);

  const subtotal = useMemo(() => {
    return (itemsOverride ?? cart.items).reduce(
      (acc, { price, quantity }) => acc + (price.unit_amount ?? 0) * quantity,
      0,
    );
  }, [itemsOverride, cart.items]);

  const setCartOpen = useCallback(
    (isCartOpen: boolean) => {
      setCart(({ ...previousCartRest }) => ({
        ...previousCartRest,
        isCartOpen,
      }));
    },
    [setCart],
  );

  const [cartRecentlyUpdated, setCartRecentlyUpdated] = useState(false);

  useEffect(() => {
    setCartRecentlyUpdated(true);

    const timeout = setTimeout(() => {
      setCartRecentlyUpdated(false);
    }, 600);

    return () => {
      clearTimeout(timeout);
    };
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        ...cart,
        ...(itemsOverride
          ? {
              items: itemsOverride,
            }
          : {}),
        addItem,
        setItemQuantity,
        removeItem,
        openCart: () => setCartOpen(true),
        clearCart,
        hasSubscriptionInCart,
        subtotal,
        closeCart: () => setCartOpen(false),
        cartRecentlyUpdated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
