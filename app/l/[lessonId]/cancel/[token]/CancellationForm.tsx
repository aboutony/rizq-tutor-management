
'use client';

import { useState } from 'react';
import { LessonDetailsForParent } from '@/lib/data';

interface CancellationFormProps {
    lessonDetails: LessonDetailsForParent;
    messages: any;
    token: string;
}

export function CancellationForm({ lessonDetails, messages, token }: CancellationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const lessonTime = new Date(lessonDetails.confirmed_start_at_utc || new Date());
    const now = new Date();
    const hoursUntilLesson = (lessonTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLate = hoursUntilLesson < (lessonDetails.cutoff_hours || 0);

    const handleCancel = async () => {
        setIsLoading(true);
        setError('');

        const res = await fetch(`/api/public/lessons/${lessonDetails.lesson_id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
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
                <h1 className="text-2xl font-bold text-gray-800">{messages.parent_flow.cancellation.success_message}</h1>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{messages.parent_flow.cancellation.confirm_title}</h1>

            <div className="text-left bg-gray-50 p-4 rounded-md mb-6">
                <p><span className="font-semibold">{messages.parent_flow.cancellation.student}:</span> {lessonDetails.student_name}</p>
                <p><span className="font-semibold">{messages.parent_flow.cancellation.lesson}:</span> {lessonDetails.lesson_label}</p>
                <p><span className="font-semibold">{messages.parent_flow.cancellation.time}:</span> {lessonTime.toLocaleString()}</p>
            </div>

            {isLate && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                    <p className="font-bold">{messages.parent_flow.cancellation.late_warning.replace('{hours}', (lessonDetails.cutoff_hours || 0).toString())}</p>
                </div>
            )}

            {error && <p className="text-sm text-center text-red-600 mb-4">{error}</p>}

            <button
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400"
            >
                {isLoading ? messages.common.loading : messages.common.actions.confirm_cancellation}
            </button>
        </div>
    );
}
