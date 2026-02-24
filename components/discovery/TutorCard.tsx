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

const categoryColors: Record<string, string> = {
    academic: '#22c55e',
    music: '#a855f7',
    language: '#3b82f6',
    fine_arts: '#f59e0b',
};

export default function TutorCard({ tutor }: TutorCardProps) {
    const t = useTranslations('student_flow.discovery');
    const locale = useLocale();

    // Render stars
    const stars = Math.round(tutor.avg_stars * 2) / 2; // round to 0.5
    const fullStars = Math.floor(stars);
    const halfStar = stars % 1 >= 0.5;

    return (
        <a
            href={`/${locale}/t/${tutor.slug}`}
            className="block rounded-2xl p-4 transition-all group"
            style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))',
                        border: '1px solid rgba(59,130,246,0.2)',
                        color: '#93c5fd',
                    }}
                >
                    {tutor.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                            {tutor.name}
                        </h3>
                        {tutor.available_today && (
                            <span
                                className="flex-shrink-0 w-2 h-2 rounded-full"
                                style={{
                                    background: '#22c55e',
                                    boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                                }}
                                title={t('available_today')}
                            />
                        )}
                    </div>

                    {/* Rating + Distance + Price */}
                    <div className="flex items-center gap-3 mt-1 text-xs">
                        {/* Stars */}
                        <span className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                    key={i}
                                    style={{
                                        color:
                                            i < fullStars
                                                ? '#fbbf24'
                                                : i === fullStars && halfStar
                                                    ? '#fbbf24'
                                                    : 'rgba(255,255,255,0.15)',
                                        fontSize: '11px',
                                    }}
                                >
                                    ★
                                </span>
                            ))}
                            <span className="ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {tutor.avg_stars > 0 ? tutor.avg_stars.toFixed(1) : '—'}
                                <span className="ml-0.5">({tutor.rating_count})</span>
                            </span>
                        </span>

                        {/* Distance */}
                        {tutor.distance_km !== null && (
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                                📍 {tutor.distance_km} km
                            </span>
                        )}

                        {/* Price */}
                        {tutor.min_price !== null && (
                            <span style={{ color: '#4ade80' }}>
                                ${Number(tutor.min_price).toFixed(0)}+
                            </span>
                        )}
                    </div>

                    {/* Bio */}
                    {tutor.bio && (
                        <p className="mt-1.5 text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {tutor.bio}
                        </p>
                    )}

                    {/* Subject tags */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {tutor.subjects.slice(0, 4).map((sub, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                                style={{
                                    background: `${categoryColors[sub.category] || '#6b7280'}15`,
                                    color: categoryColors[sub.category] || '#6b7280',
                                    border: `1px solid ${categoryColors[sub.category] || '#6b7280'}30`,
                                }}
                            >
                                {sub.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Arrow */}
                <svg
                    className="flex-shrink-0 mt-1 opacity-30 group-hover:opacity-60 transition-opacity"
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </a>
    );
}
