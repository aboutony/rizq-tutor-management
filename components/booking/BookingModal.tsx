'use client';

import React, { useState, useCallback } from 'react';

interface ExpertiseItem {
    id: string;
    label: string;
    category: string;
    pricing: { duration: number; price: string }[];
}

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    tutorId: string;
    tutorName: string;
    expertise: ExpertiseItem[];
    tutorDistricts: string[];
    selectedDay: number;
    selectedTime: string;
    locale: string;
    t: (key: string) => string;
}

const DAY_NAMES: Record<string, string[]> = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
};

export default function BookingModal({
    isOpen,
    onClose,
    tutorId,
    tutorName,
    expertise,
    tutorDistricts,
    selectedDay,
    selectedTime,
    locale,
    t,
}: BookingModalProps) {
    const [studentName, setStudentName] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(expertise[0]?.id || '');
    const [selectedDuration, setSelectedDuration] = useState(60);
    const [note, setNote] = useState('');
    const [studentDistrict, setStudentDistrict] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const dayNames = DAY_NAMES[locale] || DAY_NAMES.en;
    const dayLabel = dayNames[selectedDay] || '';

    // Format time for display
    const hour = parseInt(selectedTime.split(':')[0]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const timeLabel = `${displayHour}:${selectedTime.split(':')[1] || '00'} ${ampm}`;

    // District match check
    const districtMatch = studentDistrict
        ? tutorDistricts.some((d) => d.toLowerCase().includes(studentDistrict.toLowerCase()))
        : null;

    const currentExpertise = expertise.find((e) => e.id === selectedSubject);
    const availableDurations = currentExpertise?.pricing || [];

    const handleSubmit = useCallback(async () => {
        if (!studentName.trim() || !selectedSubject) return;

        setSending(true);
        try {
            // Build the requested start datetime (use current week's date for the selected day)
            const now = new Date();
            const currentDay = now.getDay();
            const diff = selectedDay - currentDay;
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + (diff >= 0 ? diff : diff + 7));
            const [h, m] = selectedTime.split(':');
            targetDate.setHours(parseInt(h), parseInt(m || '0'), 0, 0);

            const res = await fetch('/api/public/lesson-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tutorId,
                    studentName: studentName.trim(),
                    lessonTypeId: selectedSubject,
                    duration: selectedDuration,
                    requestedStartAt: targetDate.toISOString(),
                    studentNote: note.trim() || undefined,
                    studentDistrict: studentDistrict.trim() || undefined,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setStudentName('');
                    setNote('');
                    setStudentDistrict('');
                }, 2000);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Failed to send request');
            }
        } catch {
            alert('Network error. Please try again.');
        } finally {
            setSending(false);
        }
    }, [studentName, selectedSubject, selectedDuration, selectedDay, selectedTime, tutorId, note, studentDistrict, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                className="w-full max-w-md rounded-2xl p-6 space-y-5 border shadow-2xl
          bg-white/10 dark:bg-white/5 backdrop-blur-xl
          border-white/20 dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Success State */}
                {success ? (
                    <div className="text-center py-8 space-y-4 animate-fade-in">
                        <div className="text-5xl">🎉</div>
                        <h3 className="text-xl font-bold text-white">{t('success')}</h3>
                        <p className="text-sm text-white/70">{tutorName}</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">{t('modal_title')}</h3>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Session Info Chips */}
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20 backdrop-blur-md">
                                📅 {dayLabel}
                            </span>
                            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20 backdrop-blur-md">
                                🕐 {timeLabel}
                            </span>
                            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20 backdrop-blur-md">
                                👤 {tutorName}
                            </span>
                        </div>

                        {/* Student Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                                {t('name_label')}
                            </label>
                            <input
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder={t('name_placeholder')}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                            />
                        </div>

                        {/* Subject Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                                {t('subject_label')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {expertise.map((e) => (
                                    <button
                                        key={e.id}
                                        onClick={() => {
                                            setSelectedSubject(e.id);
                                            const firstDuration = e.pricing[0]?.duration;
                                            if (firstDuration) setSelectedDuration(firstDuration);
                                        }}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selectedSubject === e.id
                                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {e.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        {availableDurations.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                                    {t('duration_label')}
                                </label>
                                <div className="flex gap-2">
                                    {availableDurations.map((p) => (
                                        <button
                                            key={p.duration}
                                            onClick={() => setSelectedDuration(p.duration)}
                                            className={`flex-1 px-3 py-2.5 rounded-xl text-center border transition-all ${selectedDuration === p.duration
                                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="text-sm font-bold">{p.duration} min</div>
                                            <div className="text-[10px] text-white/40">${p.price}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Student Note */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                                {t('note_label')}
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={t('note_placeholder')}
                                maxLength={500}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm resize-none"
                            />
                        </div>

                        {/* District */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                                {t('district_label')}
                            </label>
                            <input
                                type="text"
                                value={studentDistrict}
                                onChange={(e) => setStudentDistrict(e.target.value)}
                                placeholder={t('district_placeholder')}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                            />
                            {districtMatch !== null && (
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${districtMatch
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                                    }`}>
                                    <span>{districtMatch ? '✅' : '⚠️'}</span>
                                    <span>{districtMatch ? t('district_match') : t('district_mismatch')}</span>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={sending || !studentName.trim() || !selectedSubject}
                            className="w-full py-3.5 rounded-xl text-sm font-bold text-white
                bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all shadow-lg shadow-blue-500/25"
                        >
                            {sending ? t('sending') : t('send_request')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
