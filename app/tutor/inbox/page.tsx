
import { getTutorIdFromSession } from '@/lib/session';
import { getLessonRequests } from '@/lib/data';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import frMessages from '@/messages/fr.json';
import { RequestList } from './RequestList';

// Placeholder for locale detection
const getMessages = (locale: string = 'en') => {
  if (locale === 'ar') return arMessages;
  if (locale === 'fr') return frMessages;
  return enMessages;
};

export default async function TutorInboxPage() {
  const tutorId = await getTutorIdFromSession();
  const messages = getMessages();

  // This check should technically be redundant due to middleware, but it's good practice.
  if (!tutorId) {
    return null; // Or a redirect, but middleware handles it.
  }

  const requests = await getLessonRequests(tutorId);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {messages.tutor_flow.inbox.title}
        </h1>
        
        <RequestList initialRequests={requests} messages={messages} />
      </div>
    </main>
  );
}
