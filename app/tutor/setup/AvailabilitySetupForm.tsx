
'use client';

import { useState, FormEvent } from 'react';

interface AvailabilitySetupFormProps {
  messages: any;
  commonMessages: any;
  onSuccess: () => void;
}

const DAYS = [
  { label: 'mon', value: 1 },
  { label: 'tue', value: 2 },
  { label: 'wed', value: 3 },
  { label: 'thu', value: 4 },
  { label: 'fri', value: 5 },
  { label: 'sat', value: 6 },
  { label: 'sun', value: 0 },
];
// Generating time slots from 8 AM to 8 PM
const TIMES = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`);

export function AvailabilitySetupForm({ messages, commonMessages, onSuccess }: AvailabilitySetupFormProps) {
  const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSlotChange = (day: number, time: string) => {
    const key = `${day}-${time}`;
    setSelectedSlots(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const availability = Object.keys(selectedSlots)
      .filter(key => selectedSlots[key])
      .map(key => {
        const [day, time] = key.split('-');
        return { day: parseInt(day), time };
      });

    const res = await fetch('/api/tutor/setup/step3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability }),
    });

    setIsLoading(false);

    if (res.ok) {
      onSuccess();
    } else {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-gray-800">{messages.step_3_title}</h2>
      <p className="text-sm text-gray-500 mb-6">{messages.step_3_subtitle}</p>
      <p className="text-sm text-gray-600 mb-4">{messages.availability_instructions}</p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              {DAYS.map(day => (
                <th key={day.value} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {commonMessages.days[day.label]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {TIMES.map(time => (
              <tr key={time}>
                <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-500">{time}</td>
                {DAYS.map(day => (
                  <td key={day.value} className="px-2 py-2 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      checked={!!selectedSlots[`${day.value}-${time}`]}
                      onChange={() => handleSlotChange(day.value, time)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-6 text-sm text-center text-red-600">{error}</p>}
      
      <button
        type="submit"
        disabled={isLoading}
        className="mt-8 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
      >
        {isLoading ? messages.saving : commonMessages.actions.save_and_finish}
      </button>
    </form>
  );
}
