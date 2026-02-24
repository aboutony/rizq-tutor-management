'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDeleteAccount = useCallback(async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/tutor/account', { method: 'DELETE', credentials: 'same-origin' });
            if (res.ok) {
                window.location.href = '/';
            } else {
                console.error('[Delete] Failed');
                setIsDeleting(false);
            }
        } catch (err) {
            console.error('[Delete] Error:', err);
            setIsDeleting(false);
        }
    }, []);

    // Group expertise by category
    const grouped = expertise.reduce<Record<string, string[]>>((acc, item) => {
        const cat = item.category || 'academic';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item.label);
        return acc;
    }, {});

    const getIconForLabel = (label: string): string => {
        for (const cat of CURRICULUM_SCHEMA) {
            if (label.startsWith(cat.label)) return cat.icon;
        }
        return '📚';
    };

    return (
        <>
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

                        {/* ── Danger Zone ── */}
                        <div className="pt-6 mt-4 border-t border-rizq-border/50">
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
                                    text-red-500/70 hover:text-red-500 hover:bg-red-500/5
                                    border border-transparent hover:border-red-500/15
                                    transition-all duration-200"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                                {t('delete_account')}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ── Delete Confirmation Modal ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm rounded-2xl p-6 space-y-5 bg-rizq-surface-elevated border border-rizq-border shadow-2xl">
                        {/* Icon */}
                        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-rizq-text">{t('delete_title')}</h3>
                            <p className="text-sm text-rizq-text-muted leading-relaxed">
                                {t('delete_body')}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="flex-1 btn-secondary text-sm"
                            >
                                {t('delete_cancel')}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white
                                    bg-red-500 hover:bg-red-600 active:bg-red-700
                                    disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? t('delete_deleting') : t('delete_confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
