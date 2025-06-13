'use client';

import {Button} from '@/components/ui/button';
import Image from 'next/image';
import Container from '@/app/components/Container';
import instructors from '@/app/data/instructors.json';

import {
  UserRoundPlus as PlusIcon,
  Phone as PhoneIcon,
  Mail as EmailIcon,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';

export default function Instructors() {
  const {t} = useTranslation();

  return (
    <>
      <div className="flex">
        <h1 className="flex-1 text-3xl font-bold">
          {t('dashboard.instructors.instructors')}
        </h1>
        <Button className="gap-2 bg-[#312356] text-base font-bold shadow transition hover:cursor-default hover:shadow-md">
          <PlusIcon className="h-5 w-5"></PlusIcon>
          {t('dashboard.instructors.add')}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {instructors.map((instructor) => {
          return (
            <Container
              className="relative flex flex-col items-center gap-4 transition hover:shadow-lg"
              key={instructor.id}
            >
              <Image
                className="relative h-[80px] w-[80px] rounded-full shadow"
                fill
                quality={100}
                src={`/headshots/${instructor.profilePhoto}.jpg`}
                alt={`Profile photo of ${instructor.name}`}
              />
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-medium">{instructor.name}</h3>
                <p className="text-sm text-subdued">
                  {instructor.numClasses} {t('dashboard.instructors.class')}
                  {instructor.numClasses == 1
                    ? ''
                    : t('dashboard.instructors.es')}{' '}
                  {t('dashboard.instructors.this_week')}
                </p>
              </div>
              <div className="flex gap-5">
                <PhoneIcon color="var(--secondary)"></PhoneIcon>
                <EmailIcon color="var(--secondary)"></EmailIcon>
              </div>
            </Container>
          );
        })}
      </div>
    </>
  );
}
