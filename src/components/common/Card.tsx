import type { ComponentProps } from 'react';

type CardProps = ComponentProps<'div'>;

export const Card = ({ children, className, ...rest }: CardProps) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-100 p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
