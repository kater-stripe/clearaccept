'use client';

import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import type { ComponentProps } from 'react';

type SelectProps<T, N extends boolean = false> = Omit<
  ComponentProps<'select'>,
  'onChange' | 'placeholder'
> & {
  label: string;
  nullable?: N;
  value?: N extends true ? T | undefined : T;
  onChange?: (value: N extends true ? T | undefined : T) => void;
  options: { value: T; label: string }[];
  hideLabel?: boolean;
  placeholder?: string;
};

export const Select = <T extends string | number, N extends boolean = false>({
  label,
  value,
  onChange,
  options,
  nullable = false as N,
  className,
  required,
  hideLabel = false,
  placeholder,
  ...rest
}: SelectProps<T, N>) => {
  return (
    <div>
      <label
        htmlFor={generateHtmlIdFromLabel(label)}
        className={`block mb-2 text-sm font-medium text-gray-700 ${hideLabel ? 'hidden' : ''
          }`}
      >
        {label}
        {required && <span className='text-red-500'> *</span>}
      </label>
      <select
        {...rest}
        id={generateHtmlIdFromLabel(label)}
        value={value ?? ''}
        onChange={(e) => {
          if (!onChange) {
            return;
          }

          const value = Number(e.target.value) || e.target.value || undefined;

          onChange(value as N extends true ? T | undefined : T);
        }}
        className={`w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 ${className}`}
        required={required}
      >
        <option
          value={''}
          disabled={!nullable}
          className={`
          ${!nullable && !placeholder ? 'hidden' : ''}
        `}
        >
          {placeholder}
        </option>
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};
