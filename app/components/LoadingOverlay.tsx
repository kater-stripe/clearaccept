import {useTranslation} from 'react-i18next';
import {Spinner} from './ui';

export default function LoadingOverlay() {
  const {t} = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <Spinner />
        <p className="text-text-color mt-4 text-lg font-semibold">
          {t('loading')}
        </p>
      </div>
    </div>
  );
}
