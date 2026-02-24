'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { TutorCalendar, SlotData, SessionData } from '@/components/calendar/TutorCalendar';
import { CalendarSummary } from '@/components/calendar/CalendarSummary';
import { SuccessToast } from '@/components/navigation/SuccessToast';

export default function SchedulePage() {
    const t = useTranslations('tutor_flow.calendar');
    const tn = useTranslations('tutor_flow.nav');
    const locale = useLocale();
    const router = useRouter();

    const [slots, setSlots] = useState<Record<string, SlotData>>({});
    const [sessions, setSessions] = useState<Record<string, SessionData>>({});
    const [summary, setSummary] = useState({ confirmed: 0, pending: 0, available: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [toastVisible, setToastVisible] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/tutor/availability', {
                    cache: 'no-store',
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    const data = await res.json();
                    setSlots(data.slots || {});
                    setSessions(data.sessions || {});
                    setSummary(data.summary || { confirmed: 0, pending: 0, available: 0 });
                }
            } catch (err) {
                console.error('Failed to fetch availability:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleSave = useCallback(async (updatedSlots: Record<string, SlotData>) => {
        const res = await fetch('/api/tutor/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slots: updatedSlots }),
            credentials: 'same-origin',
        });

        if (!res.ok) throw new Error('Failed to save');

        const data = await res.json();
        setSummary((prev) => ({
            ...prev,
            available: data.count || Object.values(updatedSlots).filter((s) => s.available).length,
        }));

        // Show success toast
        setToastVisible(true);

        // Auto-redirect to dashboard after 2 seconds
        setTimeout(() => {
            router.push(`/${locale}/dashboard/tutor`);
        }, 2000);
    }, [locale, router]);

    const handleToastDismiss = useCallback(() => {
        setToastVisible(false);
    }, []);

    return (
        <>
            <SuccessToast
                message={tn('schedule_saved')}
                visible={toastVisible}
                onDismiss={handleToastDismiss}
                durationMs={2000}
            />

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
                {isLoading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 rounded-2xl bg-rizq-surface-elevated animate-pulse" />
                            ))}
                        </div>
                        <div className="h-96 rounded-2xl bg-rizq-surface-elevated animate-pulse" />
                    </div>
                ) : (
                    <>
                        <CalendarSummary
                            confirmedCount={summary.confirmed}
                            pendingCount={summary.pending}
                            availableCount={summary.available}
                        />
                        <div className="card !p-4">
                            <TutorCalendar
                                initialSlots={slots}
                                sessions={sessions}
                                onSave={handleSave}
                            />
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
