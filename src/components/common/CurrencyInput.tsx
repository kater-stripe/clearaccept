'use client';

import { CurrencyCode } from '@/constants/currencyCodes';
import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import { useMemo } from 'react';
import ReactCurrencyInputField, {
  CurrencyInputProps as ReactCurrencyInputFieldProps,
} from 'react-currency-input-field';

type CurrencyInputProps = Omit<
  ReactCurrencyInputFieldProps,
  'id' | 'onValueChange' | 'value' | 'onChange'
> & {
  label: string;
  onChange?: (value: number) => void;
  currency: CurrencyCode;
};

export const CurrencyInput = ({
  label,
  onChange,
  className,
  currency = 'usd',
  required,
  ...rest
}: CurrencyInputProps) => {
  const id = generateHtmlIdFromLabel(label);

  const multiplier = useMemo(() => {
    const currencyParts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).formatToParts(1);

    const fractionPart =
      currencyParts.find((part) => part.type === 'fraction')?.value.length ?? 0;

    return Math.pow(10, fractionPart);
  }, [currency]);

  return (
    <div>
      <label
        htmlFor={id}
        className='block mb-2 text-sm font-medium text-gray-700 flex items-center gap-x-1'
      >
        {label}
        {required && <span className='text-red-500'>*</span>}
      </label>
      <div className='relative'>
        <ReactCurrencyInputField
          id={id}
          onValueChange={(_value, _name, values) => {
            if (!onChange) {
              return;
            }

            onChange(Math.floor((values?.float || 0) * multiplier));
          }}
          className={`w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          intlConfig={{
            locale: 'en-US',
            currency: currency.toUpperCase(),
          }}
          required={required}
          {...rest}
        />
      </div>
    </div>
  );
};
