'use client';

type LoadingSpinnerProps = {
  className?: string;
  strokeWidth?: number;
};

export const LoadingSpinner = ({
  className,
  strokeWidth = 2,
}: LoadingSpinnerProps) => {
  const padding = Math.max(strokeWidth, 2);
  const size = 36;
  const center = size / 2;
  const radius = center - padding;
  const viewBoxSize = size + padding * 2;

  return (
    <svg
      width={viewBoxSize}
      height={viewBoxSize}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      xmlns='http://www.w3.org/2000/svg'
      stroke='currentColor'
      className={`fill-current mx-auto ${className}`}
      data-testid='loading-spinner'
    >
      <title>Loading</title>
      <g fill='none' fillRule='evenodd'>
        <g
          transform={`translate(${padding} ${padding})`}
          strokeWidth={strokeWidth}
        >
          <circle strokeOpacity='.5' cx={center} cy={center} r={radius} />
          <path
            d={`M${center + radius} ${center}c0-${radius} -${radius}-${radius} -${radius}-${radius}`}
          >
            <animateTransform
              attributeName='transform'
              type='rotate'
              from={`0 ${center} ${center}`}
              to={`360 ${center} ${center}`}
              dur='1s'
              repeatCount='indefinite'
            />
          </path>
        </g>
      </g>
    </svg>
  );
};
