'use client';

import { LoadingSpinner } from './LoadingSpinner';

export const LoadingOverlay = () => {
  return (
    <div className='absolute inset-0 flex items-center justify-center min-h-screen bg-white'>
      <div className='text-center'>
        <LoadingSpinner className='text-brand-primary' />
        <p className='mt-4 text-lg font-semibold text-brand-primary'>
          Loading...
        </p>
      </div>
    </div>
  );
};
