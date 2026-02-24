'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';

export interface TutorResult {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    avg_stars: number;
    rating_count: number;
    min_price: number | null;
    max_price: number | null;
    distance_km: number | null;
    available_today: boolean;
    subjects: { label: string; category: string }[];
}

interface TutorCardProps {
    tutor: TutorResult;
}

const categoryStyles: Record<string, string> = {
    academic: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    music: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    language: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    fine_arts: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

export default function TutorCard({ tutor }: TutorCardProps) {
    const t = useTranslations('student_flow.discovery');
    const locale = useLocale();

    const stars = Math.round(tutor.avg_stars * 2) / 2;
    const fullStars = Math.floor(stars);
    const halfStar = stars % 1 >= 0.5;

    return (
        <a
            href={`/${locale}/discover/tutor/${tutor.slug}`}
            className="block rounded-2xl p-4 transition-all group bg-rizq-surface-elevated border border-rizq-border hover:shadow-lg hover:border-rizq-primary/30"
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold bg-rizq-primary/10 text-rizq-primary border border-rizq-primary/20">
                    {tutor.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-rizq-text truncate group-hover:text-rizq-primary transition-colors">
                            {tutor.name}
                        </h3>
                        {tutor.available_today && (
                            <span
                                className="flex-shrink-0 w-2 h-2 rounded-full bg-rizq-success"
                                style={{ boxShadow: '0 0 6px var(--color-success)' }}
                                title={t('available_today')}
                            />
                        )}
                    </div>

                    {/* Rating + Distance + Price */}
                    <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                    key={i}
                                    className={
                                        i < fullStars || (i === fullStars && halfStar)
                                            ? 'text-amber-400'
                                            : 'text-rizq-border'
                                    }
                                    style={{ fontSize: '11px' }}
                                >
                                    ★
                                </span>
                            ))}
                            <span className="ml-1 text-rizq-text-muted">
                                {tutor.avg_stars > 0 ? tutor.avg_stars.toFixed(1) : '—'}
                                <span className="ml-0.5">({tutor.rating_count})</span>
                            </span>
                        </span>

                        {tutor.distance_km !== null && (
                            <span className="text-rizq-text-muted">📍 {tutor.distance_km} km</span>
                        )}

                        {tutor.min_price !== null && (
                            <span className="text-rizq-success font-semibold">
                                ${Number(tutor.min_price).toFixed(0)}+
                            </span>
                        )}
                    </div>

                    {/* Bio */}
                    {tutor.bio && (
                        <p className="mt-1.5 text-xs leading-relaxed text-rizq-text-muted line-clamp-2">
                            {tutor.bio}
                        </p>
                    )}

                    {/* Subject tags */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {tutor.subjects.slice(0, 4).map((sub, i) => (
                            <span
                                key={i}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${categoryStyles[sub.category] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                    }`}
                            >
                                {sub.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Arrow */}
                <svg
                    className="flex-shrink-0 mt-1 text-rizq-text-muted/40 group-hover:text-rizq-text-muted/70 transition-opacity"
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                >
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </a>
    );
}
