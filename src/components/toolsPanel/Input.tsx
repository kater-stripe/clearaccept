'use client';

import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import type { ComponentProps } from 'react';

type InputProps<T> = Omit<ComponentProps<'input'>, 'onChange'> & {
  label: string;
  value?: T;
  onChange?: (value: T) => void;
  tooltip?: string;
};

export const Input = <T extends string>({
  label,
  value,
  onChange,
  tooltip,
  ...rest
}: InputProps<T>) => {
  const id = generateHtmlIdFromLabel(label);

  return (
    <div>
      <label
        htmlFor={id}
        className='block mb-2 text-sm font-medium text-gray-700 flex items-center gap-x-1'
      >
        {label}
        {tooltip && (
          <div className='group flex relative'>
            <img
              className='h-4 w-auto'
              src={'/img/icon/info-circle.svg'}
              alt='Info'
            />
            <span className='max-w-32 text-xs text-wrap invisible group-hover:visible opacity-0 border group-hover:opacity-100 transition-opacity duration-300 bg-white text-black rounded-md absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-1 px-2 w-max'>
              {tooltip}
            </span>
          </div>
        )}
      </label>
      <input
        placeholder='Enter to override .env value'
        {...rest}
        id={id}
        type={rest.type || 'text'}
        value={value ?? ''}
        onChange={(e) => {
          if (!onChange) {
            return;
          }

          onChange((e.target.value ?? '') as T);
        }}
        className='w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
      />
    </div>
  );
};
