'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function TutorDashboard() {
    const t = useTranslations('tutor_flow.calendar');
    const tn = useTranslations('tutor_flow.nav');
    const locale = useLocale();
    const router = useRouter();

    const [summary, setSummary] = useState({ confirmed: 0, pending: 0, available: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/tutor/availability', {
                    cache: 'no-store',
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    const data = await res.json();
                    setSummary(data.summary || { confirmed: 0, pending: 0, available: 0 });
                }
            } catch (err) {
                console.error('Failed to fetch summary:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
            {/* Welcome section */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-rizq-text">{tn('dashboard_title')}</h2>
                <p className="text-sm text-rizq-text-muted">{tn('dashboard_subtitle')}</p>
            </div>

            {/* Summary cards */}
            {isLoading ? (
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-rizq-surface-elevated animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {/* Confirmed */}
                    <div className="card !p-4 space-y-1.5 border-l-[3px] border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 overflow-hidden">
                        <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{summary.confirmed}</span>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/90 whitespace-nowrap overflow-hidden text-ellipsis">{t('confirmed')}</p>
                    </div>
                    {/* Pending */}
                    <div className="card !p-4 space-y-1.5 border-l-[3px] border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10 overflow-hidden">
                        <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{summary.pending}</span>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/90 whitespace-nowrap overflow-hidden text-ellipsis">{t('pending')}</p>
                    </div>
                    {/* Available */}
                    <div className="card !p-4 space-y-1.5 border-l-[3px] border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10 overflow-hidden">
                        <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{summary.available}</span>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/90 whitespace-nowrap overflow-hidden text-ellipsis">{t('available')}</p>
                    </div>
                </div>
            )}

            {/* Quick actions */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-rizq-text">{tn('quick_actions')}</h3>

                <button
                    onClick={() => router.push(`/${locale}/dashboard/tutor/schedule`)}
                    className="w-full card !p-4 flex items-center gap-4 hover:border-rizq-primary/30 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-rizq-primary/10 border border-rizq-primary/20">
                        📅
                    </div>
                    <div className="flex-1 text-left">
                        <span className="text-sm font-bold text-rizq-text group-hover:text-rizq-primary transition-colors">
                            {tn('tab_schedule')}
                        </span>
                        <p className="text-[11px] text-rizq-text-muted">{tn('schedule_desc')}</p>
                    </div>
                    <svg className="text-rizq-text-muted/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>

                <button
                    onClick={() => router.push(`/${locale}/dashboard/tutor/profile`)}
                    className="w-full card !p-4 flex items-center gap-4 hover:border-rizq-primary/30 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-rizq-secondary/10 border border-rizq-secondary/20">
                        🎓
                    </div>
                    <div className="flex-1 text-left">
                        <span className="text-sm font-bold text-rizq-text group-hover:text-rizq-primary transition-colors">
                            {tn('my_profile')}
                        </span>
                        <p className="text-[11px] text-rizq-text-muted">{tn('profile_view_desc')}</p>
                    </div>
                    <svg className="text-rizq-text-muted/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
