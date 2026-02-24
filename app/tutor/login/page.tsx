
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import frMessages from '@/messages/fr.json';
import { LoginForm } from './LoginForm';

// In a real app, you would use a library like 'next-intl' or 'accept-language'
// to determine the locale from the request headers or a cookie.
// For now, we default to English.
const getMessages = (locale: string) => {
  if (locale === 'ar') return arMessages;
  if (locale === 'fr') return frMessages;
  return enMessages;
};

export default function TutorLoginPage() {
  const messages = getMessages('en'); // Defaulting to English

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {messages.common.app_name}
        </h1>
        <LoginForm messages={messages.tutor_flow.login} />
      </div>
    </main>
  );
}
