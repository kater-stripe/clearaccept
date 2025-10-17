'use client';

import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import type { ComponentProps } from 'react';

type InputProps<T> = Omit<ComponentProps<'input'>, 'onChange' | 'id'> & {
  label: string;
  value?: T;
  onChange?: (value: T) => void;
};

export const Input = <T extends string>({
  label,
  value,
  onChange,
  className,
  required,
  ...rest
}: InputProps<T>) => {
  const id = generateHtmlIdFromLabel(label);

  return (
    <div className='grow w-full'>
      <label
        htmlFor={id}
        className='block mb-2 text-sm font-medium text-gray-700 flex items-center gap-x-1'
      >
        {label}
        {required && <span className='text-red-500'>*</span>}
      </label>
      <input
        id={id}
        type={rest.type || 'text'}
        value={value ?? ''}
        required={required}
        onChange={(e) => {
          if (!onChange) {
            return;
          }

          onChange((e.target.value ?? '') as T);
        }}
        className={`w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${className}`}
        {...rest}
      />
    </div>
  );
};
