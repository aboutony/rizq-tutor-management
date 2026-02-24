'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { CURRICULUM_SCHEMA, type CurriculumCategory } from '@/lib/curriculum-lb';

const TOTAL_STEPS = 4;

export default function OnboardingWizard() {
    const t = useTranslations('tutor_flow.onboarding');
    const tc = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    // ── State ──
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<Record<string, string[]>>({});
    const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
    const [showCelebration, setShowCelebration] = useState(false);

    // ── Validation ──
    const isStep1Valid = name.trim().length >= 2;
    const isStep2Valid = selectedCategories.length > 0;
    const isStep3Valid = selectedCategories.every(
        (catId) => (selectedSubs[catId] || []).length > 0
    );

    const canProceed = step === 1 ? isStep1Valid : step === 2 ? isStep2Valid : step === 3 ? isStep3Valid : false;

    // ── Navigation ──
    const goNext = useCallback(async () => {
        if (!canProceed) return;
        setAnimDir('forward');

        if (step === 3) {
            // Save and celebrate
            setSaving(true);
            try {
                const selections = selectedCategories.map((catId) => ({
                    categoryId: catId,
                    subIds: selectedSubs[catId] || [],
                    otherTexts: Object.fromEntries(
                        Object.entries(otherTexts).filter(([k]) => k.startsWith(catId) || (selectedSubs[catId] || []).some(sid => k === sid))
                    ),
                }));

                // Rebuild otherTexts per selection
                const selectionsWithOther = selectedCategories.map((catId) => {
                    const subIds = selectedSubs[catId] || [];
                    const textsForCat: Record<string, string> = {};
                    for (const subId of subIds) {
                        if (otherTexts[subId]) {
                            textsForCat[subId] = otherTexts[subId];
                        }
                    }
                    return { categoryId: catId, subIds, otherTexts: textsForCat };
                });

                const res = await fetch('/api/tutor/onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name.trim(), selections: selectionsWithOther }),
                });

                if (!res.ok) throw new Error('Save failed');

                setStep(4);
                setShowCelebration(true);
            } catch (err) {
                console.error('[Onboarding] Save error:', err);
            } finally {
                setSaving(false);
            }
        } else {
            setStep((s) => s + 1);
        }
    }, [canProceed, step, name, selectedCategories, selectedSubs, otherTexts]);

    const goBack = useCallback(() => {
        setAnimDir('back');
        setStep((s) => Math.max(1, s - 1));
    }, []);

    // ── Category toggle (multi-select) ──
    const toggleCategory = (catId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
        );
    };

    // ── Sub toggle (multi-select) ──
    const toggleSub = (catId: string, subId: string) => {
        setSelectedSubs((prev) => {
            const current = prev[catId] || [];
            return {
                ...prev,
                [catId]: current.includes(subId) ? current.filter((s) => s !== subId) : [...current, subId],
            };
        });
    };

    // ── Other text ──
    const setOtherText = (subId: string, text: string) => {
        setOtherTexts((prev) => ({ ...prev, [subId]: text }));
    };

    // ── Auto-redirect after celebration ──
    useEffect(() => {
        if (showCelebration) {
            const timer = setTimeout(() => {
                router.replace(`/${locale}/dashboard/tutor`);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showCelebration, locale, router]);

    // ── Currently viewing category for step 3 ──
    const [viewingCatIndex, setViewingCatIndex] = useState(0);
    const currentCat = selectedCategories.length > 0
        ? CURRICULUM_SCHEMA.find((c) => c.id === selectedCategories[viewingCatIndex])
        : null;

    return (
        <div className="animate-fade-in">
            <div className="max-w-lg mx-auto px-4 py-6">
                {/* Progress dots */}
                {step < 4 && (
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-2 rounded-full transition-all duration-500 ${s === step
                                    ? 'w-8 bg-rizq-primary'
                                    : s < step
                                        ? 'w-2 bg-rizq-primary/50'
                                        : 'w-2 bg-rizq-border'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Step content with animation */}
                <div
                    key={step}
                    className="animate-fade-in"
                >
                    {/* ═══════ STEP 1: Welcome + Name ═══════ */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="text-4xl mb-4">👋</div>
                                <h2 className="text-2xl font-bold text-rizq-text">{t('step1_title')}</h2>
                                <p className="text-sm text-rizq-text-muted">{t('step1_subtitle')}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-rizq-text">{t('name_label')}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('name_placeholder')}
                                    className="input-field text-lg"
                                    autoFocus
                                />
                                {name.length > 0 && name.trim().length < 2 && (
                                    <p className="text-xs text-rizq-danger">{t('name_min')}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════ STEP 2: Category Selection ═══════ */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="text-4xl mb-4">📚</div>
                                <h2 className="text-2xl font-bold text-rizq-text">{t('step2_title')}</h2>
                                <p className="text-sm text-rizq-text-muted">{t('step2_subtitle')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {CURRICULUM_SCHEMA.map((cat) => {
                                    const isSelected = selectedCategories.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => toggleCategory(cat.id)}
                                            className={`relative p-4 rounded-2xl text-left transition-all duration-200 border-2 ${isSelected
                                                ? 'bg-rizq-primary/10 border-rizq-primary shadow-md shadow-rizq-primary/10'
                                                : 'bg-rizq-surface-elevated border-rizq-border hover:border-rizq-primary/30'
                                                }`}
                                        >
                                            {/* Checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rizq-primary flex items-center justify-center">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                        <path d="M5 12l5 5L20 7" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span className="text-2xl block mb-2">{cat.icon}</span>
                                            <span className={`text-sm font-semibold block ${isSelected ? 'text-rizq-primary' : 'text-rizq-text'
                                                }`}>
                                                {cat.label}
                                            </span>
                                            <span className="text-[10px] text-rizq-text-muted">
                                                {cat.subcategories.length - 1} {t('specializations')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedCategories.length > 0 && (
                                <p className="text-center text-xs text-rizq-primary font-medium">
                                    {t('selected_count', { count: selectedCategories.length })}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ═══════ STEP 3: Sub-category Selection ═══════ */}
                    {step === 3 && currentCat && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="text-4xl mb-4">{currentCat.icon}</div>
                                <h2 className="text-xl font-bold text-rizq-text">{currentCat.label}</h2>
                                <p className="text-sm text-rizq-text-muted">{t('step3_subtitle')}</p>
                            </div>

                            {/* Category switcher tabs */}
                            {selectedCategories.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {selectedCategories.map((catId, idx) => {
                                        const cat = CURRICULUM_SCHEMA.find((c) => c.id === catId);
                                        if (!cat) return null;
                                        const hasSubs = (selectedSubs[catId] || []).length > 0;
                                        return (
                                            <button
                                                key={catId}
                                                onClick={() => setViewingCatIndex(idx)}
                                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${idx === viewingCatIndex
                                                    ? 'bg-rizq-primary text-white border-rizq-primary'
                                                    : hasSubs
                                                        ? 'bg-rizq-success/10 text-rizq-success border-rizq-success/30'
                                                        : 'bg-rizq-surface-elevated text-rizq-text-muted border-rizq-border'
                                                    }`}
                                            >
                                                {cat.icon} {cat.label}
                                                {hasSubs && idx !== viewingCatIndex && <span>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Sub-category list */}
                            <div className="space-y-2">
                                {currentCat.subcategories.map((sub) => {
                                    const isSelected = (selectedSubs[currentCat.id] || []).includes(sub.id);
                                    return (
                                        <div key={sub.id}>
                                            <button
                                                onClick={() => toggleSub(currentCat.id, sub.id)}
                                                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border ${isSelected
                                                    ? 'bg-rizq-primary/10 border-rizq-primary text-rizq-text'
                                                    : 'bg-rizq-surface-elevated border-rizq-border text-rizq-text hover:border-rizq-primary/30'
                                                    }`}
                                            >
                                                <div
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                                                        ? 'bg-rizq-primary border-rizq-primary'
                                                        : 'border-rizq-border'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                            <path d="M5 12l5 5L20 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium flex-1 text-left">{sub.label}</span>
                                            </button>

                                            {/* "Other" text input */}
                                            {sub.requiresInput && isSelected && (
                                                <div className="ml-8 mt-2 mb-1">
                                                    <input
                                                        type="text"
                                                        value={otherTexts[sub.id] || ''}
                                                        onChange={(e) => setOtherText(sub.id, e.target.value)}
                                                        placeholder={t('other_placeholder')}
                                                        className="input-field text-sm"
                                                        autoFocus
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {(selectedSubs[currentCat.id] || []).length > 0 && (
                                <p className="text-center text-xs text-rizq-success font-medium">
                                    {t('sub_selected', { count: (selectedSubs[currentCat.id] || []).length })}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ═══════ STEP 4: Celebration 🎉 ═══════ */}
                    {step === 4 && (
                        <div className="text-center space-y-6 py-12">
                            {/* Confetti burst effect */}
                            <div className="relative">
                                <div className="text-7xl animate-bounce">🎉</div>
                                {/* Floating particles */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {['🌟', '✨', '🎊', '⭐', '💫', '🎆'].map((emoji, i) => (
                                        <span
                                            key={i}
                                            className="absolute text-2xl"
                                            style={{
                                                left: `${15 + i * 13}%`,
                                                top: `${10 + (i % 3) * 15}%`,
                                                animation: `float-${(i % 3) + 1} ${2 + i * 0.5}s ease-in-out infinite`,
                                                animationDelay: `${i * 0.2}s`,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {emoji}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-bold text-rizq-text">{t('celebration_title')}</h2>
                                <p className="text-lg text-rizq-primary font-semibold">{name}</p>
                                <p className="text-sm text-rizq-text-muted">{t('celebration_body')}</p>
                            </div>

                            {/* Expertise summary */}
                            <div className="card text-left space-y-2">
                                <h3 className="text-sm font-bold text-rizq-text">{t('your_expertise')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCategories.map((catId) => {
                                        const cat = CURRICULUM_SCHEMA.find((c) => c.id === catId);
                                        if (!cat) return null;
                                        return (
                                            <span
                                                key={catId}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rizq-primary/10 text-rizq-primary border border-rizq-primary/20"
                                            >
                                                {cat.icon} {cat.label} ({(selectedSubs[catId] || []).length})
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <p className="text-xs text-rizq-text-muted animate-pulse">
                                {t('redirecting')}
                            </p>
                        </div>
                    )}
                </div>

                {/* ──── Navigation buttons ──── */}
                {step < 4 && (
                    <div className="flex gap-3 mt-8 pb-8">
                        {step > 1 && (
                            <button
                                onClick={goBack}
                                className="btn-secondary flex-1"
                            >
                                {t('back')}
                            </button>
                        )}
                        <button
                            onClick={goNext}
                            disabled={!canProceed || saving}
                            className={`btn-primary flex-1 ${!canProceed ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            {saving ? t('saving') : step === 3 ? t('finish') : t('next')}
                        </button>
                    </div>
                )}
            </div>

            {/* Celebration keyframe overrides */}
            {step === 4 && (
                <style>{`
          @keyframes float-1 { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(10deg); } }
          @keyframes float-2 { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-30px) rotate(-15deg); } }
          @keyframes float-3 { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-15px) rotate(5deg); } }
        `}</style>
            )}
        </div>
    );
}
