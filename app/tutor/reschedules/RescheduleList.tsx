
'use client';

import { useState } from 'react';
import { RescheduleRequestDetails } from '@/lib/data';

interface RescheduleListProps {
  initialRequests: RescheduleRequestDetails[];
  messages: any;
}

export function RescheduleList({ initialRequests, messages }: RescheduleListProps) {
  const [requests, setRequests] = useState<RescheduleRequestDetails[]>(initialRequests);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const handleAction = async (requestId: string, action: 'approve' | 'decline') => {
    setLoading(prev => ({ ...prev, [requestId]: true }));
    setError('');

    try {
      const res = await fetch(`/api/tutor/reschedules/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error('Failed to update request');
      }

      setRequests(prev => prev.filter(req => req.request_id !== requestId));

    } catch (err) {
      setError(messages.common.errors.generic);
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };
  
  if (requests.length === 0) {
    return <p className="text-gray-600 bg-white p-6 rounded-md shadow-sm border">{messages.tutor_flow.reschedules.no_requests}</p>
  }

  return (
    <div className="space-y-4">
       {error && <p className="text-sm text-center text-red-600 mb-4">{error}</p>}
       {requests.map((req) => (
        <div key={req.request_id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-grow">
                <p className="font-bold text-lg text-gray-800">{req.lesson_label} - {req.student_name}</p>
                <div className="mt-2 text-sm text-gray-600">
                    <p>{messages.tutor_flow.reschedules.original_time}: <span className="font-medium line-through">{new Date(req.original_time_utc).toLocaleString()}</span></p>
                    <p>{messages.tutor_flow.reschedules.proposed_time}: <span className="font-medium text-indigo-600">{new Date(req.proposed_time_utc).toLocaleString()}</span></p>
                </div>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
                <button
                    onClick={() => handleAction(req.request_id, 'decline')}
                    disabled={loading[req.request_id]}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                    {messages.common.actions.decline}
                </button>
                <button
                    onClick={() => handleAction(req.request_id, 'approve')}
                    disabled={loading[req.request_id]}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                    {loading[req.request_id] ? messages.common.loading : messages.common.actions.approve}
                </button>
            </div>
        </div>
       ))}
    </div>
  );
}
