'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { CURRICULUM_SCHEMA } from '@/lib/curriculum-lb';
import { LEBANON_GOVERNORATES } from '@/lib/districts-lb';

export default function OnboardingWizard() {
    const t = useTranslations('tutor_flow.onboarding');
    const locale = useLocale() as 'en' | 'ar' | 'fr';
    const router = useRouter();

    // ── State ──
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<Record<string, string[]>>({});
    const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // ── Validation ──
    const isStep1Valid = name.trim().length >= 2;
    const isStep2Valid = selectedDistricts.length > 0;
    const isStep3Valid = selectedCategories.length > 0;
    const isStep4Valid = selectedCategories.every(
        (catId) => (selectedSubs[catId] || []).length > 0
    );

    const canProceed =
        step === 1 ? isStep1Valid :
            step === 2 ? isStep2Valid :
                step === 3 ? isStep3Valid :
                    step === 4 ? isStep4Valid : false;

    // ── Navigation ──
    const goNext = useCallback(async () => {
        if (!canProceed) return;

        if (step === 4) {
            // Final step — save and celebrate
            setSaving(true);
            try {
                const selectionsWithOther = selectedCategories.map((catId) => {
                    const subIds = selectedSubs[catId] || [];
                    const textsForCat: Record<string, string> = {};
                    for (const subId of subIds) {
                        if (otherTexts[subId]) textsForCat[subId] = otherTexts[subId];
                    }
                    return { categoryId: catId, subIds, otherTexts: textsForCat };
                });

                const res = await fetch('/api/tutor/onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name.trim(),
                        districts: selectedDistricts,
                        selections: selectionsWithOther,
                    }),
                });

                if (!res.ok) throw new Error('Save failed');

                setStep(5);
                setShowCelebration(true);
            } catch (err) {
                console.error('[Onboarding] Save error:', err);
            } finally {
                setSaving(false);
            }
        } else {
            setStep((s) => s + 1);
        }
    }, [canProceed, step, name, selectedDistricts, selectedCategories, selectedSubs, otherTexts]);

    const goBack = useCallback(() => {
        setStep((s) => Math.max(1, s - 1));
    }, []);

    // ── District toggle ──
    const toggleDistrict = (districtId: string) => {
        setSelectedDistricts((prev) =>
            prev.includes(districtId)
                ? prev.filter((d) => d !== districtId)
                : [...prev, districtId]
        );
    };

    // Toggle all districts in a governorate
    const toggleGovernorate = (govId: string) => {
        const gov = LEBANON_GOVERNORATES.find((g) => g.id === govId);
        if (!gov) return;
        const districtIds = gov.districts.map((d) => d.id);
        const allSelected = districtIds.every((id) => selectedDistricts.includes(id));

        if (allSelected) {
            setSelectedDistricts((prev) => prev.filter((id) => !districtIds.includes(id)));
        } else {
            setSelectedDistricts((prev) => Array.from(new Set([...prev, ...districtIds])));
        }
    };

    // ── Category toggle ──
    const toggleCategory = (catId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
        );
    };

    // ── Sub toggle ──
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

    // ── Step 4: viewing category for sub-selection ──
    const [viewingCatIndex, setViewingCatIndex] = useState(0);
    const currentCat = selectedCategories.length > 0
        ? CURRICULUM_SCHEMA.find((c) => c.id === selectedCategories[viewingCatIndex])
        : null;

    return (
        <div className="animate-fade-in">
            <div className="max-w-lg mx-auto px-4 py-6">
                {/* Progress dots */}
                {step < 5 && (
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`h-2 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-rizq-primary'
                                    : s < step ? 'w-2 bg-rizq-primary/50'
                                        : 'w-2 bg-rizq-border'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                <div key={step} className="animate-fade-in">

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

                    {/* ═══════ STEP 2: Location Selection (26 Districts) ═══════ */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="text-4xl mb-4">📍</div>
                                <h2 className="text-2xl font-bold text-rizq-text">{t('step2_loc_title')}</h2>
                                <p className="text-sm text-rizq-text-muted">{t('step2_loc_subtitle')}</p>
                            </div>

                            {selectedDistricts.length > 0 && (
                                <p className="text-center text-xs text-rizq-primary font-medium">
                                    {t('districts_selected', { count: selectedDistricts.length })}
                                </p>
                            )}

                            <div className="space-y-4">
                                {LEBANON_GOVERNORATES.map((gov) => {
                                    const govDistrictIds = gov.districts.map((d) => d.id);
                                    const selectedCount = govDistrictIds.filter((id) => selectedDistricts.includes(id)).length;
                                    const allSelected = selectedCount === gov.districts.length;

                                    return (
                                        <div key={gov.id} className="card !p-0 overflow-hidden">
                                            {/* Governorate header */}
                                            <button
                                                onClick={() => toggleGovernorate(gov.id)}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-rizq-primary/5 border-b border-rizq-border hover:bg-rizq-primary/10 transition-colors"
                                            >
                                                <span className="text-sm font-bold text-rizq-text">
                                                    {gov.labels[locale]}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {selectedCount > 0 && (
                                                        <span className="text-[10px] font-semibold text-rizq-primary bg-rizq-primary/10 px-2 py-0.5 rounded-full">
                                                            {selectedCount}/{gov.districts.length}
                                                        </span>
                                                    )}
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-rizq-primary border-rizq-primary' : 'border-rizq-border'
                                                        }`}>
                                                        {allSelected && (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                                <path d="M5 12l5 5L20 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>

                                            {/* District list */}
                                            <div className="divide-y divide-rizq-border/50">
                                                {gov.districts.map((district) => {
                                                    const isSelected = selectedDistricts.includes(district.id);
                                                    return (
                                                        <button
                                                            key={district.id}
                                                            onClick={() => toggleDistrict(district.id)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? 'bg-rizq-primary/5' : 'hover:bg-rizq-surface-elevated'
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-rizq-primary border-rizq-primary' : 'border-rizq-border'
                                                                }`}>
                                                                {isSelected && (
                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                                        <path d="M5 12l5 5L20 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <span className={`text-sm font-medium ${isSelected ? 'text-rizq-primary' : 'text-rizq-text'
                                                                }`}>
                                                                {district.labels[locale]}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ═══════ STEP 3: Category Selection ═══════ */}
                    {step === 3 && (
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

                    {/* ═══════ STEP 4: Sub-category Selection ═══════ */}
                    {step === 4 && currentCat && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="text-4xl mb-4">{currentCat.icon}</div>
                                <h2 className="text-xl font-bold text-rizq-text">{currentCat.label}</h2>
                                <p className="text-sm text-rizq-text-muted">{t('step3_subtitle')}</p>
                            </div>

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
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-rizq-primary border-rizq-primary' : 'border-rizq-border'
                                                    }`}>
                                                    {isSelected && (
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                            <path d="M5 12l5 5L20 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium flex-1 text-left">{sub.label}</span>
                                            </button>
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

                    {/* ═══════ STEP 5: Celebration 🎉 ═══════ */}
                    {step === 5 && (
                        <div className="text-center space-y-6 py-12">
                            <div className="relative">
                                <div className="text-7xl animate-bounce">🎉</div>
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

                            {/* Expertise + Districts summary */}
                            <div className="card text-left space-y-3">
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
                                {selectedDistricts.length > 0 && (
                                    <>
                                        <h3 className="text-sm font-bold text-rizq-text mt-2">{t('your_districts')}</h3>
                                        <p className="text-xs text-rizq-text-muted">
                                            📍 {selectedDistricts.length} {t('districts_label')}
                                        </p>
                                    </>
                                )}
                            </div>

                            <p className="text-xs text-rizq-text-muted animate-pulse">
                                {t('redirecting')}
                            </p>
                        </div>
                    )}
                </div>

                {/* ──── Navigation buttons ──── */}
                {step < 5 && (
                    <div className="flex gap-3 mt-8 pb-8">
                        {step > 1 && (
                            <button onClick={goBack} className="btn-secondary flex-1">
                                {t('back')}
                            </button>
                        )}
                        <button
                            onClick={goNext}
                            disabled={!canProceed || saving}
                            className={`btn-primary flex-1 ${!canProceed ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            {saving ? t('saving') : step === 4 ? t('finish') : t('next')}
                        </button>
                    </div>
                )}
            </div>

            {/* Celebration keyframes */}
            {step === 5 && (
                <style>{`
          @keyframes float-1 { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(10deg); } }
          @keyframes float-2 { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-30px) rotate(-15deg); } }
          @keyframes float-3 { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-15px) rotate(5deg); } }
        `}</style>
            )}
        </div>
    );
}
