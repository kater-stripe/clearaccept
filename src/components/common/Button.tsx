import type { ComponentProps } from 'react';

export type ButtonProps = ComponentProps<'button'> & {
  colorMode?: 'light' | 'dark';
};

export const Button = ({
  children,
  disabled,
  colorMode = 'light',
  className,
  ...rest
}: ButtonProps) => {
  const baseClasses =
    'flex items-center justify-center gap-x-2 w-fit px-4 py-2 text-sm font-bold rounded-md disabled:opacity-50';

  const modeClasses = {
    light:
      'bg-brand-primary text-brand-primary-contrasting-text hover:bg-brand-primary-accent',
    dark: `${disabled ? 'bg-brand-secondary-accent hover:cursor-not-allowed' : 'bg-brand-secondary hover:bg-brand-secondary-accent'} text-brand-secondary-contrasting-text`,
  };

  const buttonClasses = `${baseClasses} ${modeClasses[colorMode]} ${className}`;

  return (
    <button
      type='button'
      className={buttonClasses}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};
