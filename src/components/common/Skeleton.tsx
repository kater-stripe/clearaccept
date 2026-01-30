import type { ComponentProps } from 'react';

type SkeletonProps = ComponentProps<'div'>;

export const Skeleton = ({ className = '', ...rest }: SkeletonProps) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...rest}
  />
);

