import type { ComponentProps } from 'react';

export type ButtonProps = ComponentProps<'button'>;

export const Button = ({
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) => {
  return (
    <button
      type='button'
      className={`flex bg-indigo-600 hover:bg-indigo-700 items-center justify-center gap-x-2 w-fit px-4 py-2 text-sm text-white font-bold rounded-md disabled:opacity-50 ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};
