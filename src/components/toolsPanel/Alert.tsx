import { Button } from './Button';

type AlertProps = {
  text: string;
  buttonText?: string;
  onClick?: () => void;
};

export const Alert = ({ text, buttonText, onClick }: AlertProps) => {
  return (
    <div className='rounded-md p-3 bg-indigo-50 border border-indigo-200 text-indigo-700'>
      <p>{text}</p>
      <Button className='mt-2' onClick={onClick}>
        {buttonText}
      </Button>
    </div>
  );
};
