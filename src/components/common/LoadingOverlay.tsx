'use client';

import { LoadingSpinner } from './LoadingSpinner';

export const LoadingOverlay = () => {
  return (
    <div className='absolute inset-0 flex items-center justify-center min-h-screen bg-brand-primary'>
      <div className='text-center'>
        <LoadingSpinner className='text-brand-primary-contrasting-text' />
        <p className='mt-4 text-lg font-semibold text-brand-primary-contrasting-text'>
          Loading...
        </p>
      </div>
    </div>
  );
};
