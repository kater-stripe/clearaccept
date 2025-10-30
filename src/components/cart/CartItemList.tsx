'use client';

import { useCart } from '@/context/CartContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useProductTranslation } from '@/hooks/useProductTranslation';
import { formatPrice } from '@/utils/formatPrice';
import { formatTime } from '@/utils/formatTime';
import type { StripeCheckoutLineItem } from '@stripe/stripe-js';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type CartItemListProps = {
  lineItems?: StripeCheckoutLineItem[];
};

export const CartItemList = ({ lineItems }: CartItemListProps) => {
  const { language, currency } = useDemoConfig();
  const { items, removeItem, setItemQuantity, closeCart } = useCart();

  const generateOptionTags = (maxQuantity = 10) => {
    return Array.from({ length: maxQuantity }, (_, i) => i + 1).map((num) => (
      <option key={num} value={num}>
        {num}
      </option>
    ));
  };

  const { tp } = useProductTranslation();
  const { t } = useTranslation();

  return (
    <ul className='divide-y divide-gray-200'>
      {items.map((item) => {
        const matchingLineItem = lineItems?.find(
          (lineItem) => lineItem.name === item.product.name,
        );

        /**
         * If `lineItems` is provided, this is indicative of Elements with Checkout Sessions.
         * To display the correct price, we should use the pre-formatted amount from the corresponding line item.
         */
        const amount =
          (matchingLineItem?.unitAmount.amount || item.price.unit_amount) ?? 0;

        const startTime = item.product.metadata.startTime
          ? new Date(`1970-01-01T${item.product.metadata.startTime}`)
          : null;
        const endTime = item.product.metadata.endTime
          ? new Date(`1970-01-01T${item.product.metadata.endTime}`)
          : null;

        return (
          <li
            key={item.product.id}
            className='cart-item flex items-center px-4 py-4 sm:px-6 border-b'
            data-item-id={item.product.id}
          >
            <div className='flex-shrink-0'>
              <Image
                src={
                  item.product.images.length > 0
                    ? item.product.images[0]
                    : '/img/empty-product-image.png'
                }
                alt={item.product.name}
                width={80}
                height={80}
                className='w-20 rounded-md'
              />
            </div>
            <div className='ml-6 flex flex-1 flex-col'>
              <div className='flex justify-between items-center'>
                <div className='min-w-0 flex-1'>
                  <h4 className='text-md flex flex-col'>
                    <Link
                      href={`/${language}/products/${item.product.id}`}
                      className='font-bold text-gray-900'
                      onClick={() => closeCart()}
                    >
                      {tp(item.product).name}
                    </Link>
                    {startTime && (
                      <span className='text-gray-900 text-sm'>
                        {formatTime(
                          startTime.getHours(),
                          startTime.getMinutes(),
                          language,
                        )}
                        {endTime &&
                          ` - ${formatTime(endTime.getHours(), endTime.getMinutes(), language)}`}
                      </span>
                    )}
                  </h4>
                </div>
                <div className='ml-4 flow-root flex-shrink-0'>
                  <button
                    type='button'
                    onClick={() => removeItem(item)}
                    className='remove-item -m-2.5 flex items-center justify-center bg-white p-2.5 text-gray-400 hover:text-gray-500 shadow-none'
                  >
                    <span className='sr-only'>Remove</span>
                    <Image
                      src='/img/icon/trash.svg'
                      alt='Remove'
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
              </div>
              <div className='flex flex-1 justify-between items-center pt-4'>
                <p
                  id={`amount-item-${item.price.id}`}
                  className='text-sm font-semibold text-gray-900'
                >
                  {formatPrice(amount, language, currency)}
                  {item.price.recurring?.interval &&
                    ` ${t(`perTimeUnits.${item.price.recurring.interval}`)}`}
                </p>
                {!item.product.metadata.categoryMembership && (
                  <div>
                    <label
                      htmlFor={`quantity-${item.price.id}`}
                      className='sr-only'
                    >
                      Quantity
                    </label>
                    <select
                      id={`quantity-${item.price.id}`}
                      name='quantity'
                      value={item.quantity}
                      onChange={(e) =>
                        setItemQuantity(item, Number.parseInt(e.target.value))
                      }
                      className='rounded-md p-2 pr-8 border border-gray-300 text-left text-sm font-medium text-gray-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-1 focus:ring-brand-secondary sm:text-sm'
                    >
                      {generateOptionTags()}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
