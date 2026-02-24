
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileSetupForm, LessonType } from './ProfileSetupForm';
import { PricingSetupForm } from './PricingSetupForm';
import { AvailabilitySetupForm } from './AvailabilitySetupForm';

type Messages = {
  common: any;
  tutor_flow: any;
};

interface SetupFlowProps {
  messages: Messages;
}

export function SetupFlow({ messages }: SetupFlowProps) {
  const [step, setStep] = useState(1);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const router = useRouter();

  const handleProfileSuccess = (createdLessonTypes: LessonType[]) => {
    setLessonTypes(createdLessonTypes);
    setStep(2);
  };

  const handlePricingSuccess = () => {
    setStep(3);
  };

  const handleAvailabilitySuccess = () => {
    router.replace('/tutor/dashboard');
  };

  return (
    <div className="mt-8 bg-white p-8 rounded-lg shadow-md border border-gray-200">
      {step === 1 && (
        <ProfileSetupForm
          messages={messages.tutor_flow.setup}
          commonMessages={messages.common}
          onSuccess={handleProfileSuccess}
        />
      )}
      {step === 2 && (
        <PricingSetupForm
          messages={messages.tutor_flow.setup}
          commonMessages={messages.common}
          lessonTypes={lessonTypes}
          onSuccess={handlePricingSuccess}
        />
      )}
      {step === 3 && (
        <AvailabilitySetupForm
          messages={messages.tutor_flow.setup}
          commonMessages={messages.common}
          onSuccess={handleAvailabilitySuccess}
        />
      )}
    </div>
  );
}
