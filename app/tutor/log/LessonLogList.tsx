
'use client';

import { useState } from 'react';
import { LessonLogItem } from '@/lib/data';

interface LessonLogListProps {
  initialLessons: LessonLogItem[];
  messages: any;
}

export function LessonLogList({ initialLessons, messages }: LessonLogListProps) {
  const [lessons, setLessons] = useState<LessonLogItem[]>(initialLessons);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const handleMarkComplete = async (lessonId: string) => {
    setLoading(prev => ({ ...prev, [lessonId]: true }));
    setError('');

    try {
      const res = await fetch(`/api/tutor/lessons/${lessonId}/complete`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to mark as complete');

      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId ? { ...lesson, status: 'completed' } : lesson
      ));

    } catch (err) {
      setError(messages.common.errors.generic);
    } finally {
      setLoading(prev => ({ ...prev, [lessonId]: false }));
    }
  };
  
  if (lessons.length === 0) {
    return <p className="text-gray-600 bg-white p-6 rounded-md shadow-sm border">{messages.tutor_flow.lesson_log_page.no_lessons}</p>
  }

  return (
    <div className="space-y-4">
       {error && <p className="text-sm text-center text-red-600 mb-4">{error}</p>}
       {lessons.map((lesson) => (
        <div key={lesson.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-grow">
                <p className="font-bold text-lg text-gray-800">{lesson.lesson_label} - {lesson.student_name}</p>
                <p className="text-sm text-gray-600">{new Date(lesson.confirmed_start_at_utc).toLocaleString()}</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    lesson.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                    {messages.tutor_flow.lesson_log_page.status[lesson.status]}
                </span>
                {lesson.status === 'confirmed' && (
                    <button
                        onClick={() => handleMarkComplete(lesson.id)}
                        disabled={loading[lesson.id]}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                         {loading[lesson.id] ? messages.common.loading : messages.tutor_flow.lesson_log_page.actions.mark_complete}
                    </button>
                )}
            </div>
        </div>
       ))}
    </div>
  );
}
