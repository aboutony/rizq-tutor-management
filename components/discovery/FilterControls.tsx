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
            {/* Row 1: Sort toggles + Available Today */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Price sort */}
                <button
                    onClick={() =>
                        onSortChange(sort === 'price_asc' ? 'price_desc' : sort === 'price_desc' ? 'rating' : 'price_asc')
                    }
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border
            ${sort.startsWith('price_')
                            ? 'bg-rizq-success/10 text-rizq-success border-rizq-success/30'
                            : 'bg-rizq-surface-elevated text-rizq-text-muted border-rizq-border'
                        }`}
                >
                    <span>{sort === 'price_desc' ? '↓' : '↑'}</span>
                    {t('sort_price')}
                    {sort === 'price_asc' && <span className="opacity-60">↑</span>}
                    {sort === 'price_desc' && <span className="opacity-60">↓</span>}
                </button>

                {/* Rating sort */}
                <button
                    onClick={() => onSortChange(sort === 'rating' ? 'price_asc' : 'rating')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border
            ${sort === 'rating'
                            ? 'bg-rizq-warning/10 text-rizq-warning border-rizq-warning/30'
                            : 'bg-rizq-surface-elevated text-rizq-text-muted border-rizq-border'
                        }`}
                >
                    ⭐ {t('sort_rating')}
                </button>

                {/* Distance sort */}
                <button
                    onClick={() => onSortChange(sort === 'distance' ? 'rating' : 'distance')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border
            ${sort === 'distance'
                            ? 'bg-rizq-primary/10 text-rizq-primary border-rizq-primary/30'
                            : 'bg-rizq-surface-elevated text-rizq-text-muted border-rizq-border'
                        }`}
                >
                    📍 {t('sort_distance')}
                </button>

                <div className="flex-1" />

                {/* Available Today toggle */}
                <button
                    onClick={() => onAvailableTodayChange(!availableToday)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border
            ${availableToday
                            ? 'bg-rizq-primary/15 text-rizq-primary border-rizq-primary/30 shadow-sm shadow-rizq-primary/10'
                            : 'bg-rizq-surface-elevated text-rizq-text-muted border-rizq-border'
                        }`}
                >
                    <span
                        className={`w-2 h-2 rounded-full transition-all ${availableToday ? 'bg-rizq-primary shadow-sm shadow-rizq-primary/50' : 'bg-rizq-border'
                            }`}
                    />
                    {t('available_today')}
                </button>
            </div>

            {/* Row 2: Rating threshold chips */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-rizq-text-muted">
                    {t('min_rating')}:
                </span>
                {RATINGS.map((r) => {
                    const isActive = minRating === r.value;
                    return (
                        <button
                            key={r.label}
                            onClick={() => onMinRatingChange(r.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border
                ${isActive
                                    ? 'bg-rizq-warning/10 text-rizq-warning border-rizq-warning/25'
                                    : 'bg-rizq-surface-elevated text-rizq-text-muted/60 border-rizq-border'
                                }`}
                        >
                            {t(`rating_options.${r.label}`)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
