'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';

type ShippingOptionProps = {
  title: string | null;
  description: string | undefined;
  price: string;
  selected: boolean;
  onSelect: () => void;
  value: string;
};

export const ShippingOption = ({
  title,
  description,
  price,
  selected,
  onSelect,
  value,
}: ShippingOptionProps) => {
  const { t } = useTranslation();

  return (
    <label
      className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
        selected ? 'border-gray-900' : 'border-transparent'
      }`}
    >
      <input
        type='radio'
        name='delivery-method'
        value={value}
        className='sr-only'
        checked={selected}
        onChange={onSelect}
      />
      <span className='flex flex-1'>
        <span className='flex flex-col'>
          <span className='block text-sm font-bold text-gray-900'>
            {t(title ?? '')}
          </span>
          {description && (
            <span className='mt-1 flex items-center text-sm text-gray-500'>
              {t(description ?? '')}
            </span>
          )}
          <span className='mt-6 text-sm font-medium text-gray-900'>
            {price}
          </span>
        </span>
      </span>
      {selected && (
        <Image
          src='/img/icon/check-circle.svg'
          alt='Success checkmark circle'
          height={20}
          width={20}
          className='h-5 w-5 text-gray-900'
        />
      )}
      <span
        className={`delivery-options-border pointer-events-none absolute -inset-px rounded-lg ${
          selected ? 'border-2 border-gray-900' : 'border border-transparent'
        }`}
        aria-hidden='true'
      ></span>
    </label>
  );
};
