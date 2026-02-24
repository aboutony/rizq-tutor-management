
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import frMessages from '@/messages/fr.json';
import { SetupFlow } from './SetupFlow';

// In a real app, you would use a library like 'next-intl' or 'accept-language'
// to determine the locale from the request headers or a cookie.
// For now, we default to English.
const getMessages = (locale: string) => {
  if (locale === 'ar') return arMessages;
  if (locale === 'fr') return frMessages;
  return enMessages;
};

export default function TutorSetupPage() {
  const messages = getMessages('en'); // Defaulting to English

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {messages.tutor_flow.setup.main_title}
        </h1>
         <SetupFlow messages={messages} />
      </div>
    </main>
  );
}
