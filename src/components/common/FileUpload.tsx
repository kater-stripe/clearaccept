import { generateHtmlIdFromLabel } from '@/utils/generateHtmlIdFromLabel';
import { type ComponentProps } from 'react';

type FileUploadProps = ComponentProps<'input'> & {
  label: string;
};

export const FileUpload = ({ label, ...rest }: FileUploadProps) => {
  return (
    <div>
      <label
        htmlFor={generateHtmlIdFromLabel(label)}
        className='block mb-2 text-sm font-medium text-gray-700'
      >
        {label}
      </label>
      <input type='file' className='text-sm' {...rest} />
    </div>
  );
};
