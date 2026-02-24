
'use client';

import { useState } from 'react';
import { LessonRequest } from '@/lib/data';

interface RequestListProps {
  initialRequests: LessonRequest[];
  messages: any;
}

export function RequestList({ initialRequests, messages }: RequestListProps) {
  const [requests, setRequests] = useState<LessonRequest[]>(initialRequests);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const handleAction = async (lessonId: string, action: 'accept' | 'reject') => {
    setLoading(prev => ({ ...prev, [lessonId]: true }));
    setError('');

    try {
      const res = await fetch(`/api/tutor/requests/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error('Failed to update request');
      }

      setRequests(prev => prev.filter(req => req.id !== lessonId));
      
      if (action === 'accept') {
        const request = requests.find(r => r.id === lessonId);
        if (request) {
           const message = `Hi! Your lesson for ${request.student_name} (${request.lesson_type_label}) on ${new Date(request.requested_start_at_utc).toLocaleString()} is confirmed.`;
           const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
           window.open(whatsappUrl, '_blank');
        }
      }

    } catch (err) {
      setError(messages.common.errors.generic);
    } finally {
      setLoading(prev => ({ ...prev, [lessonId]: false }));
    }
  };
  
  if (requests.length === 0) {
    return <p className="text-gray-600 bg-white p-6 rounded-md shadow-sm border">{messages.tutor_flow.inbox.no_requests}</p>
  }

  return (
    <div className="space-y-4">
       {error && <p className="text-sm text-center text-red-600 mb-4">{error}</p>}
       {requests.map((req) => (
        <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-grow">
                <p className="font-bold text-lg text-gray-800">{req.lesson_type_label}</p>
                <p className="text-sm text-gray-600">{messages.tutor_flow.inbox.student}: <span className="font-medium">{req.student_name}</span></p>
                <p className="text-sm text-gray-600">{new Date(req.requested_start_at_utc).toLocaleString()}</p>
                <p className="text-sm text-gray-500">{messages.tutor_flow.inbox.duration.replace('{minutes}', req.duration_minutes.toString())}</p>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
                <button
                    onClick={() => handleAction(req.id, 'reject')}
                    disabled={loading[req.id]}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                    {messages.common.actions.reject}
                </button>
                <button
                    onClick={() => handleAction(req.id, 'accept')}
                    disabled={loading[req.id]}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading[req.id] ? messages.common.loading : messages.common.actions.accept}
                </button>
            </div>
        </div>
       ))}
    </div>
  );
}
