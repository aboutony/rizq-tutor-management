
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { LessonDetailsForParent } from '@/lib/data';

interface RescheduleFormProps {
    lessonDetails: LessonDetailsForParent;
    messages: any;
    token: string;
}

export function RescheduleForm({ lessonDetails, messages, token }: RescheduleFormProps) {
    const [proposedTime, setProposedTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const res = await fetch(`/api/public/lessons/${lessonDetails.lesson_id}/reschedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, proposedTime }),
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
                <h1 className="text-2xl font-bold text-gray-800">{messages.parent_flow.reschedule.success_title}</h1>
                <p className="mt-2 text-gray-700">{messages.parent_flow.reschedule.success_body}</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">{messages.parent_flow.reschedule.title}</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm font-medium text-gray-600">{messages.parent_flow.reschedule.current_time}</p>
                    <p className="text-lg font-semibold text-gray-900">{new Date(lessonDetails.confirmed_start_at_utc || new Date()).toLocaleString()}</p>
                </div>
                <div>
                    <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">
                        {messages.parent_flow.reschedule.propose_new_time}
                    </label>
                    <input
                        type="datetime-local"
                        id="datetime"
                        value={proposedTime}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setProposedTime(e.target.value)}
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
                    {isLoading ? messages.common.loading : messages.common.actions.request_reschedule}
                </button>
            </form>
        </div>
    );
}
