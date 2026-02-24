
import { getLessonDetailsByToken } from '@/lib/data';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import frMessages from '@/messages/fr.json';
import { CancellationForm } from './CancellationForm';

// Placeholder for locale detection
const getMessages = (locale: string = 'en') => {
  if (locale === 'ar') return arMessages;
  if (locale === 'fr') return frMessages;
  return enMessages;
};

export default async function CancelLessonPage({ params }: { params: { lessonId: string, token: string } }) {
  const { lessonId, token } = params;
  const messages = getMessages();
  const lessonDetails = await getLessonDetailsByToken(token, 'cancel');

  if (!lessonDetails || lessonDetails.lesson_id !== lessonId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md border text-center">
            <h1 className="text-2xl font-bold text-red-600">{messages.common.errors.invalid_link}</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <CancellationForm lessonDetails={lessonDetails} messages={messages} token={token} />
      </div>
    </main>
  );
}
