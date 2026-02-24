'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { TutorPublicProfile } from '@/lib/data';

interface RequestFormProps {
  tutor: TutorPublicProfile;
  messages: any;
}

export function RequestForm({ tutor, messages }: RequestFormProps) {
  const [studentName, setStudentName] = useState('');
  const [selectedLessonTypeId, setSelectedLessonTypeId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [preferredDateTime, setPreferredDateTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLessonTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLessonTypeId(e.target.value);
    setSelectedDuration(''); // Reset duration when lesson type changes
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await fetch('/api/public/lesson-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tutorId: tutor.id,
            studentName,
            lessonTypeId: selectedLessonTypeId,
            duration: parseInt(selectedDuration),
            requestedStartAt: preferredDateTime,
        }),
    });

    setIsLoading(false);

    if (res.ok) {
        setIsSuccess(true);
    } else {
        setError(messages.common.errors.generic);
    }
  };

  if (isSuccess) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600">{messages.parent_flow.request_form.success_message_title}</h2>
            <p className="mt-2 text-gray-700">{messages.parent_flow.request_form.success_message_body}</p>
        </div>
    );
  }

  const selectedLesson = tutor.lesson_types.find(lt => lt.id === selectedLessonTypeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
            {messages.parent_flow.request_form.student_name_label}
        </label>
        <input
          type="text"
          id="studentName"
          value={studentName}
          // FIX: Explicitly type the event `e` as `ChangeEvent<HTMLInputElement>` to access `e.target.value`.
          onChange={(e: ChangeEvent<HTMLInputElement>) => setStudentName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="lessonType" className="block text-sm font-medium text-gray-700 mb-1">
            {messages.parent_flow.request_form.lesson_type_label}
        </label>
        <select
            id="lessonType"
            value={selectedLessonTypeId}
            onChange={handleLessonTypeChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            <option value="" disabled>Select a lesson</option>
            {tutor.lesson_types.map(lt => <option key={lt.id} value={lt.id}>{lt.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            {messages.parent_flow.request_form.duration_label}
        </label>
        <select
            id="duration"
            value={selectedDuration}
            // FIX: Explicitly type the event `e` as `ChangeEvent<HTMLSelectElement>` to access `e.target.value`.
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDuration(e.target.value)}
            required
            disabled={!selectedLesson}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        >
            <option value="" disabled>{selectedLesson ? 'Select a duration' : messages.parent_flow.request_form.select_lesson_first}</option>
            {selectedLesson?.pricing.map(p => 
                <option key={p.duration_minutes} value={p.duration_minutes}>
                    {messages.tutor_flow.setup.duration_minutes.replace('{minutes}', p.duration_minutes.toString())} (${p.price_amount})
                </option>
            )}
        </select>
      </div>
      <div>
        <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">
            {messages.parent_flow.request_form.datetime_label}
        </label>
        <input
            type="datetime-local"
            id="datetime"
            value={preferredDateTime}
            // FIX: Explicitly type the event `e` as `ChangeEvent<HTMLInputElement>` to access `e.target.value`.
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPreferredDateTime(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-sm text-center text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
      >
        {isLoading ? messages.common.loading : messages.common.actions.submit}
      </button>
    </form>
  );
}