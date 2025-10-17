'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import type { Input } from './Input';
import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import { useDebounceValue } from '@/hooks/useDebounceValue';

type DebouncedInputProps<T> = Parameters<typeof Input>[0] & {
  debounce: number;
};

export const DebouncedInput = <T extends string>({
  label,
  value,
  onChange,
  debounce,
  tooltip,
  ...rest
}: DebouncedInputProps<T>) => {
  const id = generateHtmlIdFromLabel(label);

  const [valueToShow, setValueToShow] = useState(value);

  useEffect(() => {
    if (value === valueToShow) {
      return;
    }

    setValueToShow(value);
  }, [value]);

  const [debouncedValue, setDebouncedValue] = useDebounceValue(
    valueToShow,
    debounce,
  );

  useEffect(() => {
    if (debouncedValue === value) {
      return;
    }

    onChange?.(debouncedValue as T);
  }, [debouncedValue]);

  return (
    <div>
      <label
        htmlFor={id}
        className='block mb-2 text-sm font-medium text-gray-700 flex items-center gap-x-1'
      >
        {label}
        {tooltip && (
          <div className='group relative'>
            <img
              className='h-4 w-auto'
              src={'/img/icon/info-circle.svg'}
              alt='Info'
            />
            <div className='absolute right-0'>
              <span className='mr-2 text-xs text-wrap invisible group-hover:visible opacity-0 border group-hover:opacity-100 transition-opacity duration-300 bg-white text-black rounded-md absolute bottom-full right-0 mb-6 py-1 px-2 w-48'>
                {tooltip}
              </span>
            </div>
          </div>
        )}
      </label>
      <input
        placeholder='Enter to override .env value'
        {...rest}
        id={id}
        type={rest.type || 'text'}
        value={valueToShow ?? ''}
        onChange={(e) => {
          setValueToShow(e.target.value);
          setDebouncedValue(e.target.value);
        }}
        className='w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
      />
    </div>
  );
};
