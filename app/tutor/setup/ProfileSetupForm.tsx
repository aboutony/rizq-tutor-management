'use client';

import { useState, FormEvent, ChangeEvent } from 'react';

export type LessonType = {
  id: string;
  label: string;
};

type LessonCategory = {
  key: 'academic' | 'language' | 'music' | 'fine_arts';
  label: string;
};

interface ProfileSetupFormProps {
  messages: any;
  commonMessages: any;
  onSuccess: (lessonTypes: LessonType[]) => void;
}

const availableLessonTypes: LessonCategory[] = [
  { key: 'academic', label: 'Math' },
  { key: 'music', label: 'Piano' },
  { key: 'language', label: 'Language' },
  { key: 'fine_arts', label: 'Fine Arts' },
];

export function ProfileSetupForm({ messages, commonMessages, onSuccess }: ProfileSetupFormProps) {
  const [name, setName] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSelectedLessons(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const lessonTypesToCreate = availableLessonTypes
        .filter(lt => selectedLessons[lt.label])
        .map(lt => ({ category: lt.key, label: lt.label }));
        
    if (lessonTypesToCreate.length === 0) {
        setError('Please select at least one lesson type.');
        return;
    }
    
    setIsLoading(true);

    const res = await fetch('/api/tutor/setup/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, lessonTypes: lessonTypesToCreate }),
    });

    setIsLoading(false);

    if (res.ok) {
      const data = await res.json();
      onSuccess(data.lessonTypes);
    } else {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-gray-800">{messages.step_1_title}</h2>
      <p className="text-sm text-gray-500 mb-6">{messages.step_1_subtitle}</p>
      
      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          {messages.name_label}
        </label>
        <input
          type="text"
          id="name"
          value={name}
          // FIX: Explicitly type the event `e` as `ChangeEvent<HTMLInputElement>` to access `e.target.value`.
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {messages.lesson_types_label}
        </label>
        <div className="grid grid-cols-2 gap-4">
            {availableLessonTypes.map(lt => (
                <label key={lt.key} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50">
                    <input
                        type="checkbox"
                        name={lt.label}
                        checked={!!selectedLessons[lt.label]}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span>{messages.lesson_types[lt.label.toLowerCase().replace(' ', '_')] || lt.label}</span>
                </label>
            ))}
        </div>
      </div>
      
      {error && <p className="mb-4 text-sm text-center text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
      >
        {isLoading ? messages.saving : commonMessages.actions.continue}
      </button>
    </form>
  );
}