
import { getTutorIdFromSession } from '@/lib/session';
import { getRescheduleRequests } from '@/lib/data';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import frMessages from '@/messages/fr.json';
import { RescheduleList } from './RescheduleList';

// Placeholder for locale detection
const getMessages = (locale: string = 'en') => {
  if (locale === 'ar') return arMessages;
  if (locale === 'fr') return frMessages;
  return enMessages;
};

export default async function TutorReschedulesPage() {
  const tutorId = await getTutorIdFromSession();
  const messages = getMessages();

  if (!tutorId) {
    return null; // Handled by middleware
  }

  const requests = await getRescheduleRequests(tutorId);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {messages.tutor_flow.reschedules.title}
        </h1>
        
        <RescheduleList initialRequests={requests} messages={messages} />
      </div>
    </main>
  );
}
