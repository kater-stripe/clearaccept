'use client';

import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import type { ComponentProps } from 'react';

type TextAreaProps<T> = Omit<
  ComponentProps<'textarea'>,
  'onChange' | 'id' | 'value'
> & {
  label: string;
  value?: T;
  onChange?: (value: T) => void;
};

export const TextArea = <T extends string>({
  label,
  value,
  onChange,
  className,
  required,
  ...rest
}: TextAreaProps<T>) => {
  const id = generateHtmlIdFromLabel(label);

  return (
    <div>
      <label
        htmlFor={id}
        className='block mb-2 text-sm font-medium text-gray-700 flex items-center gap-x-1'
      >
        {label}
        {required && <span className='text-red-500'>*</span>}
      </label>
      <textarea
        id={id}
        value={value ?? ''}
        onChange={(e) => {
          if (!onChange) {
            return;
          }

          onChange((e.target.value ?? '') as T);
        }}
        required={required}
        className={`w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${className}`}
        {...rest}
      />
    </div>
  );
};
