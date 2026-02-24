'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import BookingModal from '@/components/booking/BookingModal';

interface ExpertiseItem {
    id: string;
    label: string;
    category: string;
    pricing: { duration: number; price: string }[];
}

interface TutorData {
    tutor: { id: string; name: string; slug: string; bio: string };
    expertise: ExpertiseItem[];
    slots: Record<string, boolean>;
    booked: Record<string, string>;
    districts: { district_id: string; district_label: string }[];
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00
const DAY_LABELS: Record<string, string[]> = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ar: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
};

const CATEGORY_STYLES: Record<string, { text: string; bg: string; icon: string }> = {
    academic: { text: 'text-blue-300', bg: 'bg-blue-500/15', icon: '🎓' },
    language: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', icon: '🌐' },
    music: { text: 'text-purple-300', bg: 'bg-purple-500/15', icon: '🎵' },
    fine_arts: { text: 'text-amber-300', bg: 'bg-amber-500/15', icon: '🎨' },
};

export default function TutorDiscoverPage({ params }: { params: { slug: string } }) {
    const t = useTranslations('student_flow.booking');
    const locale = useLocale();

    const [data, setData] = useState<TutorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState(0);
    const [selectedTime, setSelectedTime] = useState('9:00');

    const dayLabels = DAY_LABELS[locale] || DAY_LABELS.en;

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/public/tutor/${params.slug}`);
                if (res.ok) {
                    setData(await res.json());
                } else {
                    setError('Tutor not found');
                }
            } catch {
                setError('Failed to load');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [params.slug]);

    const openBooking = useCallback((day: number, time: string) => {
        setSelectedDay(day);
        setSelectedTime(time);
        setModalOpen(true);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-rizq-bg">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-rizq-bg">
                <p className="text-rizq-text-muted">{error || 'Not found'}</p>
            </div>
        );
    }

    const { tutor, expertise, slots, booked, districts } = data;

    return (
        <>
            <div className="min-h-screen bg-rizq-bg">
                <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">

                    {/* Tutor Header */}
                    <div className="card !p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {tutor.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-rizq-text">{tutor.name}</h1>
                                <p className="text-xs text-rizq-text-muted mt-1">
                                    {expertise.length} {t('expertise_areas')}
                                </p>
                            </div>
                        </div>
                        {tutor.bio && (
                            <p className="text-sm text-rizq-text-muted leading-relaxed">{tutor.bio}</p>
                        )}
                    </div>

                    {/* Expertise Chips */}
                    <div className="space-y-2">
                        <h2 className="text-sm font-bold text-rizq-text">{t('subjects')}</h2>
                        <div className="flex flex-wrap gap-2">
                            {expertise.map((e) => {
                                const style = CATEGORY_STYLES[e.category] || CATEGORY_STYLES.academic;
                                return (
                                    <span
                                        key={e.id}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold border backdrop-blur-md
                      ${style.bg} ${style.text} border-white/10`}
                                    >
                                        {style.icon} {e.label}
                                        {e.pricing.length > 0 && (
                                            <span className="ml-1.5 opacity-60">
                                                · ${e.pricing[0].price}
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Service Districts */}
                    {districts.length > 0 && (
                        <div className="space-y-2">
                            <h2 className="text-sm font-bold text-rizq-text">📍 {t('service_areas')}</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {districts.map((d) => (
                                    <span
                                        key={d.district_id}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/5 text-rizq-text-muted border border-white/10"
                                    >
                                        {d.district_label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Availability Calendar */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-rizq-text">📅 {t('calendar_title')}</h2>
                        <div className="card !p-0 overflow-hidden">
                            {/* Day Headers */}
                            <div className="grid grid-cols-8 bg-rizq-surface-elevated">
                                <div className="p-2" />
                                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                    <div key={day} className="p-2 text-center text-[9px] font-bold text-rizq-text-muted uppercase">
                                        {dayLabels[day]}
                                    </div>
                                ))}
                            </div>

                            {/* Time Rows */}
                            <div className="divide-y divide-rizq-border/30">
                                {HOURS.map((hour) => {
                                    const timeKey = `${hour}:00`;
                                    return (
                                        <div key={hour} className="grid grid-cols-8">
                                            <div className="p-1.5 text-[9px] font-mono text-rizq-text-muted text-right pr-2 flex items-center justify-end">
                                                {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'p' : 'a'}
                                            </div>
                                            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                                                const slotKey = `${day}-${timeKey}`;
                                                const isAvailable = slots[slotKey];
                                                const bookingStatus = booked[slotKey];

                                                return (
                                                    <div key={day} className="p-0.5">
                                                        {bookingStatus === 'confirmed' ? (
                                                            <div className="w-full h-8 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                                                <span className="text-[8px] font-bold text-emerald-400">✓</span>
                                                            </div>
                                                        ) : bookingStatus === 'pending' ? (
                                                            <div className="w-full h-8 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                                                <span className="text-[8px] font-bold text-amber-400">⏳</span>
                                                            </div>
                                                        ) : isAvailable ? (
                                                            <button
                                                                onClick={() => openBooking(day, timeKey)}
                                                                className="w-full h-8 rounded-md bg-blue-500/10 border border-blue-500/20
                                  hover:bg-blue-500/25 hover:border-blue-500/40 active:bg-blue-500/30
                                  transition-all flex items-center justify-center group"
                                                            >
                                                                <span className="text-[8px] font-bold text-blue-400 group-hover:text-blue-300">+</span>
                                                            </button>
                                                        ) : (
                                                            <div className="w-full h-8 rounded-md" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 justify-center">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30" />
                                <span className="text-[9px] text-rizq-text-muted">{t('legend_available')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
                                <span className="text-[9px] text-rizq-text-muted">{t('legend_pending')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
                                <span className="text-[9px] text-rizq-text-muted">{t('legend_booked')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <BookingModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                tutorId={tutor.id}
                tutorName={tutor.name}
                expertise={expertise}
                tutorDistricts={districts.map((d) => d.district_label)}
                selectedDay={selectedDay}
                selectedTime={selectedTime}
                locale={locale}
                t={t}
            />
        </>
    );
}
