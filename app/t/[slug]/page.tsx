
import { getTutorBySlug } from '@/lib/data';
import Link from 'next/link';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import frMessages from '@/messages/fr.json';

// Placeholder for locale detection
const getMessages = (locale: string = 'en') => {
  if (locale === 'ar') return arMessages;
  if (locale === 'fr') return frMessages;
  return enMessages;
};

export default async function TutorPublicPage({ params }: { params: { slug: string } }) {
  const tutor = await getTutorBySlug(params.slug);
  const messages = getMessages(); // Default to English for now

  if (!tutor) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-700">{messages.parent_flow.public_page.tutor_not_found}</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-800">{tutor.name}</h1>
          {tutor.rating_count > 0 ? (
             <p className="text-sm text-gray-600 mt-1">
                {'★'.repeat(Math.round(tutor.avg_stars))}{'☆'.repeat(5 - Math.round(tutor.avg_stars))}
                <span className="ml-2">({messages.parent_flow.public_page.rating_summary.replace('{count}', tutor.rating_count.toString())})</span>
             </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">{messages.parent_flow.public_page.no_ratings}</p>
          )}

          {tutor.bio && <p className="text-gray-700 mt-4">{tutor.bio}</p>}
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">{messages.parent_flow.public_page.lessons_offered}</h2>
            <div className="space-y-6 mt-4">
              {tutor.lesson_types.length > 0 ? tutor.lesson_types.map(lt => (
                <div key={lt.id}>
                  <h3 className="text-lg font-medium text-gray-900">{lt.label}</h3>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {lt.pricing.map(p => (
                      <div key={p.duration_minutes} className="bg-gray-50 p-3 rounded-md text-center">
                        <p className="font-semibold text-gray-800">${p.price_amount}</p>
                        <p className="text-sm text-gray-600">{messages.tutor_flow.setup.duration_minutes.replace('{minutes}', p.duration_minutes.toString())}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )) : <p className="text-gray-600">{messages.parent_flow.public_page.no_lessons_yet}</p>}
            </div>
          </div>
          
           {tutor.lesson_types.length > 0 && (
              <div className="mt-8">
                  <Link href={`/t/${params.slug}/request`}
                      className="w-full block text-center bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                     {messages.parent_flow.public_page.request_lesson_cta}
                  </Link>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}
