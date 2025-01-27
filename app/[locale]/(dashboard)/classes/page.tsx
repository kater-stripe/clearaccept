'use client';

import studios from '@/app/data/studios.json';
import {Button} from '@/components/ui/button';
import Container from '@/app/components/Container';
import Image from 'next/image';

import {
  CalendarPlus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as TrashIcon,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import CheckoutModal from '@/app/components/checkout/CheckoutModal';
import {useState} from 'react';

const getDate = (daysFromToday: number, locale: string) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);

  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  } as Intl.DateTimeFormatOptions;
  return date.toLocaleDateString(locale, options);
};

function internationalizeTime(time: string, locale: string): string {
  if (['en'].includes(locale)) {
    return time;
  }

  const [hours, minutesPeriod] = time.split(':');
  const minutes = minutesPeriod.slice(0, 2);
  const period = minutesPeriod.slice(2);

  let hour = parseInt(hours);
  if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
  if (period.toLowerCase() === 'am' && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

const renderClassRow = (
  item: {
    name: string;
    studio: string;
    startTime: string;
    endTime: string;
    teacher: string;
    profilePhoto: string;
  },
  setOpen: any
) => {
  const {t} = useTranslation();
  const {settings} = useConfigContext();

  return (
    <div
      onClick={() => {
        setOpen(true);
      }}
    >
      <Container className="flex cursor-pointer items-center gap-5 py-4 transition hover:shadow-lg">
        <div className="w-[180px] font-medium text-secondary">
          {internationalizeTime(item.startTime, settings?.language ?? 'en')} -{' '}
          {internationalizeTime(item.endTime, settings?.language ?? 'en')}
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="font-bold">{t(item.name)}</div>
          <div className="text-subdued">
            {t('dashboard.classes.studio')} {item.studio}
          </div>
        </div>
        <div className="relative flex flex-1 items-center gap-2">
          <Image
            className="relative h-7 w-7 rounded-full"
            fill
            quality={100}
            src={`/headshots/${item.profilePhoto}.jpg`}
            alt={`Profile photo of ${item.name}`}
          />
          {item.teacher}
        </div>
        <div className="flex gap-6">
          <PencilIcon className="h-5 w-5" color="var(--secondary)"></PencilIcon>
          <TrashIcon className="h-5 w-5" color="var(--secondary)"></TrashIcon>
        </div>
      </Container>
    </div>
  );
};

export default function Classes() {
  const {t} = useTranslation();
  const {settings} = useConfigContext();
  const [open, setOpen] = useState(false);

  const classes = studios[0].classes.concat(studios[1].classes);
  classes.sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);

  return (
    <>
      <div className="flex gap-3">
        <h1 className="flex-1 text-3xl font-bold">
          {t('dashboard.classes.classes')}
        </h1>
        <Button
          className="gap-2 bg-[#312356] text-base font-bold shadow transition hover:shadow-md"
          disabled={true}
        >
          <PlusIcon className="h-5 w-5"></PlusIcon>
          {t('dashboard.classes.create_class')}
        </Button>
        <Button
          className="gap-2 bg-white text-base font-medium text-primary shadow transition hover:shadow-md"
          disabled={true}
        >
          <PencilIcon className="h-5 w-5"></PencilIcon>
          {t('dashboard.classes.edit_studios')}
        </Button>
      </div>
      <div className="flex gap-3 pt-4 text-xl">
        <h2 className="font-bold">{t('dashboard.classes.today')}</h2>
        <span className="font-normal text-subdued">
          {getDate(0, settings?.language ?? 'en')}
        </span>
      </div>
      <div className="flex flex-col gap-y-3">
        {classes.map((item) => {
          return renderClassRow(item, setOpen);
        })}
      </div>
      <div className="flex gap-3 pt-8 text-xl">
        <h2 className="font-bold">{t('dashboard.classes.tomorrow')}</h2>
        <span className="font-normal text-subdued">
          {getDate(1, settings?.language ?? 'en')}
        </span>
      </div>
      <div className="flex flex-col gap-y-3">
        {classes.map((item) => {
          return renderClassRow(item, setOpen);
        })}
      </div>

      <CheckoutModal open={open} setOpen={setOpen} />
    </>
  );
}
