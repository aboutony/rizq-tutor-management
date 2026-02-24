'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface FilterControlsProps {
    sort: string;
    onSortChange: (sort: string) => void;
    minRating: number | null;
    onMinRatingChange: (rating: number | null) => void;
    availableToday: boolean;
    onAvailableTodayChange: (val: boolean) => void;
}

const RATINGS = [
    { value: null, label: 'all' },
    { value: 3.0, label: '3plus' },
    { value: 4.0, label: '4plus' },
    { value: 4.5, label: '4_5plus' },
] as const;

export default function FilterControls({
    sort,
    onSortChange,
    minRating,
    onMinRatingChange,
    availableToday,
    onAvailableTodayChange,
}: FilterControlsProps) {
    const t = useTranslations('student_flow.discovery');

    return (
        <div className="space-y-3">
            {/* Row 1: Sort + Available Today */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Price sort toggle */}
                <button
                    onClick={() =>
                        onSortChange(sort === 'price_asc' ? 'price_desc' : sort === 'price_desc' ? 'rating' : 'price_asc')
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                        background: sort.startsWith('price_')
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(255,255,255,0.06)',
                        color: sort.startsWith('price_') ? '#4ade80' : 'rgba(255,255,255,0.5)',
                        border: sort.startsWith('price_')
                            ? '1px solid rgba(34,197,94,0.3)'
                            : '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <span>{sort === 'price_desc' ? '↓' : '↑'}</span>
                    {t('sort_price')}
                    {sort === 'price_asc' && <span className="opacity-60">↑</span>}
                    {sort === 'price_desc' && <span className="opacity-60">↓</span>}
                </button>

                {/* Rating sort */}
                <button
                    onClick={() => onSortChange(sort === 'rating' ? 'price_asc' : 'rating')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                        background: sort === 'rating' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                        color: sort === 'rating' ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                        border: sort === 'rating'
                            ? '1px solid rgba(251,191,36,0.3)'
                            : '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    ⭐ {t('sort_rating')}
                </button>

                {/* Distance sort (only if geo is available) */}
                <button
                    onClick={() => onSortChange(sort === 'distance' ? 'rating' : 'distance')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                        background: sort === 'distance' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                        color: sort === 'distance' ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                        border: sort === 'distance'
                            ? '1px solid rgba(59,130,246,0.3)'
                            : '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    📍 {t('sort_distance')}
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Available Today toggle */}
                <button
                    onClick={() => onAvailableTodayChange(!availableToday)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                        background: availableToday
                            ? 'rgba(59,130,246,0.2)'
                            : 'rgba(255,255,255,0.06)',
                        color: availableToday ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                        border: availableToday
                            ? '1px solid rgba(59,130,246,0.4)'
                            : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: availableToday ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                    }}
                >
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{
                            background: availableToday ? '#60a5fa' : 'rgba(255,255,255,0.2)',
                            boxShadow: availableToday ? '0 0 6px rgba(96,165,250,0.5)' : 'none',
                        }}
                    />
                    {t('available_today')}
                </button>
            </div>

            {/* Row 2: Rating threshold chips */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {t('min_rating')}:
                </span>
                {RATINGS.map((r) => {
                    const isActive = minRating === r.value;
                    return (
                        <button
                            key={r.label}
                            onClick={() => onMinRatingChange(r.value)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                background: isActive ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                                color: isActive ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                                border: isActive
                                    ? '1px solid rgba(251,191,36,0.25)'
                                    : '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            {t(`rating_options.${r.label}`)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
