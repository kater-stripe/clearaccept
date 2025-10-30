'use client';

import { useTranslation } from 'react-i18next';

export const LineBreak = ({
  messageTranslationKey,
}: {
  messageTranslationKey?: string;
}) => {
  const { t } = useTranslation();

  return (
    <div className={`relative ${messageTranslationKey ? 'py-4' : 'py-6'}`}>
      <div className='absolute inset-0 flex items-center' aria-hidden='true'>
        <div className='w-full border-t border-gray-900' />
      </div>
      {messageTranslationKey && (
        <div className='relative flex justify-center'>
          <span className='bg-white px-4 text-sm font-bold text-gray-900'>
            {t(messageTranslationKey)}
          </span>
        </div>
      )}
    </div>
  );
};
