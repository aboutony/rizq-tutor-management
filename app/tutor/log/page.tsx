
import { getTutorIdFromSession } from '@/lib/session';
import { getLessonLog } from '@/lib/data';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import frMessages from '@/messages/fr.json';
import { LessonLogList } from './LessonLogList';

// Placeholder for locale detection
const getMessages = (locale: string = 'en') => {
  if (locale === 'ar') return arMessages;
  if (locale === 'fr') return frMessages;
  return enMessages;
};

export default async function TutorLogPage() {
  const tutorId = await getTutorIdFromSession();
  const messages = getMessages();

  if (!tutorId) {
    return null; // Handled by middleware
  }

  const lessons = await getLessonLog(tutorId);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {messages.tutor_flow.lesson_log_page.title}
        </h1>
        
        <LessonLogList initialLessons={lessons} messages={messages} />
      </div>
    </main>
  );
}
