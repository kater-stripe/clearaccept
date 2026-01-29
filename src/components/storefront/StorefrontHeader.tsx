import { Logo } from '../common/Logo';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useMemo } from 'react';
import { useCart } from '@/context/CartContext';

export const StorefrontHeader = () => {
  const { account } = useDemoMerchant();
  const { openCart, items } = useCart();

  const title = useMemo(() => {
    return (
      account?.identity?.business_details?.registered_name ||
      `${account?.identity?.individual?.given_name} ${
        account?.identity?.individual?.surname
      }`.trim()
    );
  }, [account]);

  return (
    <header className='relative z-10 bg-brand-primary border-b-4 border-brand-secondary px-6 lg:px-8'>
      <nav aria-label='top' className='bg-brand-tertiary'>
        <div className='flex justify-between items-center mx-auto max-w-7xl'>
          <div className='flex flex-col sm:flex-row h-28 justify-center sm:justify-start sm:items-center gap-x-4'>
            <div className='shrink-0'>
              <Logo className='h-12' />
            </div>
            <div className='border-l-2 border-brand-primary-contrasting-text h-10 hidden sm:block' />
            <span className='text-brand-primary-contrasting-text text-lg sm:text-2xl font-semibold'>
              {title}
            </span>
          </div>
          <div className='flex items-center'>
            <button
              type='button'
              onClick={openCart}
              className='relative group -m-2 flex items-center p-2 text-brand-primary-contrasting-text'
            >
              <svg
                width='21'
                height='20'
                viewBox='0 0 21 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <title>Cart</title>
                <g clipPath='url(#clip0_59_15289)'>
                  <path
                    d='M8.43609 18.3332C8.89632 18.3332 9.26942 17.9601 9.26942 17.4998C9.26942 17.0396 8.89632 16.6665 8.43609 16.6665C7.97585 16.6665 7.60275 17.0396 7.60275 17.4998C7.60275 17.9601 7.97585 18.3332 8.43609 18.3332Z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M17.6028 18.3332C18.063 18.3332 18.4361 17.9601 18.4361 17.4998C18.4361 17.0396 18.063 16.6665 17.6028 16.6665C17.1425 16.6665 16.7694 17.0396 16.7694 17.4998C16.7694 17.9601 17.1425 18.3332 17.6028 18.3332Z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M1.76944 0.833496H5.10277L7.33611 11.9918C7.41231 12.3755 7.62103 12.7201 7.92573 12.9654C8.23042 13.2107 8.61169 13.341 9.00277 13.3335H17.1028C17.4939 13.341 17.8751 13.2107 18.1798 12.9654C18.4845 12.7201 18.6932 12.3755 18.7694 11.9918L20.1028 5.00016H5.93611'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </g>
                <defs>
                  <clipPath id='clip0_59_15289'>
                    <rect
                      width='20'
                      height='20'
                      fill='white'
                      transform='translate(0.936096)'
                    />
                  </clipPath>
                </defs>
              </svg>
              <div className='absolute -top-[0.4rem] -right-[0.4rem] flex items-center justify-center w-5 h-5 bg-brand-secondary rounded-full text-brand-secondary-contrasting-text text-xs'>
                <span>{items.length}</span>
              </div>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
