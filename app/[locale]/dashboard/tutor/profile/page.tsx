'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { CURRICULUM_SCHEMA } from '@/lib/curriculum-lb';

interface ExpertiseItem {
    label: string;
    category: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    academic: { bg: 'bg-blue-500/8', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/15', icon: '🎓' },
    language: { bg: 'bg-emerald-500/8', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/15', icon: '🌐' },
    music: { bg: 'bg-purple-500/8', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/15', icon: '🎵' },
    fine_arts: { bg: 'bg-amber-500/8', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/15', icon: '🎨' },
};

export default function ProfilePage() {
    const t = useTranslations('tutor_flow.profile');
    const locale = useLocale();
    const router = useRouter();

    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [expertise, setExpertise] = useState<ExpertiseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/tutor/profile', { credentials: 'same-origin' });
                if (res.ok) {
                    const data = await res.json();
                    setName(data.name || '');
                    setBio(data.bio || '');
                    setExpertise(data.expertise || []);
                }
            } catch (err) {
                console.error('[Profile] Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, []);

    // Group expertise by category for visual display
    const grouped = expertise.reduce<Record<string, string[]>>((acc, item) => {
        const cat = item.category || 'academic';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item.label);
        return acc;
    }, {});

    // Find curriculum icon for a label
    const getIconForLabel = (label: string): string => {
        for (const cat of CURRICULUM_SCHEMA) {
            if (label.startsWith(cat.label)) return cat.icon;
        }
        return '📚';
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-20 rounded-2xl bg-rizq-surface-elevated animate-pulse" />
                    <div className="h-40 rounded-2xl bg-rizq-surface-elevated animate-pulse" />
                </div>
            ) : (
                <>
                    {/* Profile header */}
                    <div className="card !p-6 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold bg-rizq-primary/10 text-rizq-primary border border-rizq-primary/20">
                            {name.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-rizq-text">{name || t('unnamed')}</h2>
                            <p className="text-xs text-rizq-text-muted mt-1">
                                {expertise.length} {t('expertise_count')}
                            </p>
                        </div>
                    </div>

                    {/* Bio */}
                    {bio && (
                        <div className="card !p-4 space-y-2">
                            <h3 className="text-xs font-semibold text-rizq-text-muted uppercase tracking-wider">
                                {t('bio_title')}
                            </h3>
                            <p className="text-sm text-rizq-text leading-relaxed">{bio}</p>
                        </div>
                    )}

                    {/* Expertise chips */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-rizq-text">{t('expertise_title')}</h3>
                            <span className="text-[10px] text-rizq-text-muted">
                                {Object.keys(grouped).length} {t('categories')}
                            </span>
                        </div>

                        {expertise.length === 0 ? (
                            <div className="card !p-6 text-center space-y-3">
                                <div className="text-4xl">📋</div>
                                <p className="text-sm text-rizq-text-muted">{t('no_expertise')}</p>
                                <button
                                    onClick={() => router.push(`/${locale}/dashboard/tutor/onboarding`)}
                                    className="btn-primary text-sm"
                                >
                                    {t('setup_now')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(grouped).map(([category, labels]) => {
                                    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.academic;
                                    return (
                                        <div key={category} className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {labels.map((label, i) => (
                                                    <span
                                                        key={i}
                                                        className={`glass-card !rounded-xl px-3 py-2 text-xs font-semibold border backdrop-blur-md
                              ${style.bg} ${style.text} ${style.border}`}
                                                    >
                                                        {getIconForLabel(label)} {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Edit button */}
                    {expertise.length > 0 && (
                        <button
                            onClick={() => router.push(`/${locale}/dashboard/tutor/onboarding`)}
                            className="w-full btn-secondary flex items-center justify-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            {t('edit_expertise')}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
