'use client';

import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import type { ComponentProps } from 'react';

type SelectProps<T, N extends boolean = false> = Omit<
  ComponentProps<'select'>,
  'onChange'
> & {
  label: string;
  nullable?: N;
  value?: N extends true ? T | undefined : T;
  onChange?: (value: N extends true ? T | undefined : T) => void;
  options: { value: T; label: string }[];
};

export const Select = <T extends string | number, N extends boolean = false>({
  label,
  value,
  onChange,
  options,
  nullable = false as N,
  ...rest
}: SelectProps<T, N>) => {
  return (
    <div>
      <label
        htmlFor={generateHtmlIdFromLabel(label)}
        className='block text-sm font-medium text-gray-700'
      >
        {label}
      </label>
      <div className='mt-2 grid grid-cols-1'>
        <select
          {...rest}
          id={generateHtmlIdFromLabel(label)}
          value={value ?? ''}
          onChange={(e) => {
            if (!onChange) {
              return;
            }

            const value = e.target.value || undefined;

            onChange(value as N extends true ? T | undefined : T);
          }}
          className='col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <option
            value={''}
            disabled={!nullable}
            className={`
          ${!nullable ? 'hidden' : ''}
        `}
          />
          {options.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
