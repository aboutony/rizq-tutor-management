
import { getTutorBySlug } from '@/lib/data';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import frMessages from '@/messages/fr.json';
import { RequestForm } from './RequestForm';

// Placeholder for locale detection
const getMessages = (locale: string = 'en') => {
  if (locale === 'ar') return arMessages;
  if (locale === 'fr') return frMessages;
  return enMessages;
};

export default async function RequestLessonPage({ params }: { params: { slug: string } }) {
  const tutor = await getTutorBySlug(params.slug);
  const messages = getMessages();

  if (!tutor || tutor.lesson_types.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-700 text-center">
          {tutor ? messages.parent_flow.public_page.no_lessons_yet : messages.parent_flow.public_page.tutor_not_found}
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {messages.parent_flow.request_form.title.replace('{tutorName}', tutor.name)}
        </h1>
        <div className="mt-8 bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <RequestForm tutor={tutor} messages={messages} />
        </div>
      </div>
    </main>
  );
}
