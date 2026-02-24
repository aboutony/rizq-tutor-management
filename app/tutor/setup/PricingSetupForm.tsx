'use client';

// FIX: Import `ChangeEvent` to correctly type the event object in `onChange` handlers.
import { useState, FormEvent, ChangeEvent } from 'react';

type LessonType = {
  id: string;
  label: string;
};

interface PricingSetupFormProps {
  messages: any;
  commonMessages: any;
  lessonTypes: LessonType[];
  onSuccess: () => void;
}

const DURATIONS = [30, 45, 60];

export function PricingSetupForm({ messages, commonMessages, lessonTypes, onSuccess }: PricingSetupFormProps) {
  const [prices, setPrices] = useState<Record<string, Record<number, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePriceChange = (lessonTypeId: string, duration: number, amount: string) => {
    setPrices(prev => ({
      ...prev,
      [lessonTypeId]: {
        ...prev[lessonTypeId],
        [duration]: amount
      }
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const pricesToSave = [];
    for (const lessonTypeId in prices) {
      for (const duration in prices[lessonTypeId]) {
        const amount = parseFloat(prices[lessonTypeId][duration]);
        if (!isNaN(amount) && amount > 0) {
          pricesToSave.push({
            lessonTypeId,
            duration: parseInt(duration),
            amount,
          });
        }
      }
    }
    
    const res = await fetch('/api/tutor/setup/step2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prices: pricesToSave }),
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
        <h2 className="text-xl font-semibold text-gray-800">{messages.step_2_title}</h2>
        <p className="text-sm text-gray-500 mb-6">{messages.step_2_subtitle}</p>
        
        <div className="space-y-6">
            {lessonTypes.map(lt => (
                <div key={lt.id}>
                    <h3 className="text-md font-medium text-gray-900">{lt.label}</h3>
                    <p className="text-sm text-gray-500 mb-2">{messages.price_per_duration}</p>
                    <div className="grid grid-cols-3 gap-4">
                        {DURATIONS.map(duration => (
                            <div key={duration}>
                                <label htmlFor={`${lt.id}-${duration}`} className="block text-sm font-medium text-gray-700">
                                    {messages.duration_minutes.replace('{minutes}', duration.toString())}
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        id={`${lt.id}-${duration}`}
                                        value={prices[lt.id]?.[duration] || ''}
                                        // FIX: Explicitly type the event `e` as `ChangeEvent<HTMLInputElement>` to access `e.target.value`.
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handlePriceChange(lt.id, duration, e.target.value)}
                                        className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        
        {error && <p className="mt-6 text-sm text-center text-red-600">{error}</p>}
        
        <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
            {isLoading ? messages.saving : commonMessages.actions.continue}
        </button>
    </form>
  );
}