
'use client';

// FIX: Import `ChangeEvent` to correctly type the event object in `onChange` handlers.
import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

type Messages = {
  title: string;
  phone_label: string;
  send_code_button: string;
  otp_label: string;
  verify_button: string;
  sending_code: string;
  verifying: string;
  code_sent: string;
  error_tutor_not_found: string;
  error_invalid_code: string;
  error_rate_limit: string;
  error_generic: string;
};

interface LoginFormProps {
  messages: Messages;
}

export function LoginForm({ messages }: LoginFormProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const router = useRouter();

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    setIsLoading(false);

    if (res.ok) {
      setInfo(messages.code_sent);
      setStep('otp');
    } else if (res.status === 404) {
      setError(messages.error_tutor_not_found);
    } else if (res.status === 429) {
      setError(messages.error_rate_limit);
    } else {
      setError(messages.error_generic);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });

    setIsLoading(false);

    if (res.ok) {
      router.replace('/tutor/dashboard');
    } else if (res.status === 401) {
      setError(messages.error_invalid_code);
    } else {
      setError(messages.error_generic);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">{messages.title}</h2>
      {step === 'phone' ? (
        <form onSubmit={handleSendCode}>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              {messages.phone_label}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={phone}
              // FIX: Explicitly type the event `e` as `ChangeEvent<HTMLInputElement>` to access `e.target.value`.
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+9613123456"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? messages.sending_code : messages.send_code_button}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              {messages.otp_label}
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              // FIX: Explicitly type the event `e` as `ChangeEvent<HTMLInputElement>` to access `e.target.value`.
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              required
              inputMode="numeric"
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-[0.5em]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? messages.verifying : messages.verify_button}
          </button>
        </form>
      )}
      {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}
      {info && <p className="mt-4 text-sm text-center text-green-600">{info}</p>}
      {step === 'otp' && (
        <button
          onClick={() => { setStep('phone'); setError(''); setInfo(''); }}
          className="mt-4 text-sm text-center text-gray-600 hover:text-indigo-500 w-full"
        >
          Change phone number
        </button>
      )}
    </div>
  );
}
