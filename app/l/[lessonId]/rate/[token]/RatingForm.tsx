
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { LessonDetailsForParent } from '@/lib/data';

interface RatingFormProps {
    lessonDetails: LessonDetailsForParent;
    messages: any;
    token: string;
}

export function RatingForm({ lessonDetails, messages, token }: RatingFormProps) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
        setError('Please select a star rating.');
        return;
    }
    setError('');
    setIsLoading(true);

    const res = await fetch(`/api/public/lessons/${lessonDetails.lesson_id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, stars, comment }),
    });

    setIsLoading(false);
    if (res.ok) {
        setIsSuccess(true);
    } else {
        const data = await res.json();
        setError(data.message || messages.common.errors.generic);
    }
  };

  if (isSuccess) {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md border text-center">
            <h1 className="text-2xl font-bold text-gray-800">{messages.parent_flow.rating.success_title}</h1>
            <p className="mt-2 text-gray-700">{messages.parent_flow.rating.success_body}</p>
        </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">{messages.parent_flow.rating.title}</h1>
            <p className="mt-1 text-gray-600">{messages.parent_flow.rating.subtitle
                .replace('{tutorName}', lessonDetails.tutor_name)
                .replace('{studentName}', lessonDetails.student_name)}
            </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setStars(star)} className="text-4xl">
                        <span className={star <= stars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    </button>
                ))}
            </div>
             <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    {messages.parent_flow.rating.comment_label}
                </label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                    maxLength={140}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-right text-gray-500 mt-1">{comment.length}/140</p>
            </div>
            {error && <p className="text-sm text-center text-red-600">{error}</p>}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
                {isLoading ? messages.common.loading : messages.common.actions.submit_rating}
            </button>
        </form>
    </div>
  );
}
