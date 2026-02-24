'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/ThemeToggle';
import GeoPermissionModal from '@/components/discovery/GeoPermissionModal';
import CategoryBar from '@/components/discovery/CategoryBar';
import SearchBar from '@/components/discovery/SearchBar';
import FilterControls from '@/components/discovery/FilterControls';
import TutorCard, { TutorResult } from '@/components/discovery/TutorCard';

export default function StudentDashboard() {
    const t = useTranslations('student_flow.discovery');
    const tc = useTranslations('common');

    // ── Geo state ──
    const [showGeoModal, setShowGeoModal] = useState(true);
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLng, setUserLng] = useState<number | null>(null);

    // ── Filter state ──
    const [category, setCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState('rating');
    const [minRating, setMinRating] = useState<number | null>(null);
    const [availableToday, setAvailableToday] = useState(false);

    // ── Results ──
    const [tutors, setTutors] = useState<TutorResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const isMountedRef = useRef(true);

    // ── Geo handlers ──
    const handleGeoAllow = useCallback((lat: number, lng: number) => {
        setUserLat(lat);
        setUserLng(lng);
        setSort('distance');
        setShowGeoModal(false);
    }, []);

    const handleGeoSkip = useCallback(() => {
        setShowGeoModal(false);
    }, []);

    // ── Fetch tutors ──
    const fetchTutors = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (userLat !== null && userLng !== null) {
                params.set('lat', userLat.toString());
                params.set('lng', userLng.toString());
            }
            if (category) params.set('category', category);
            if (searchQuery.trim()) params.set('q', searchQuery.trim());
            if (minRating !== null) params.set('minRating', minRating.toString());
            params.set('sort', sort);
            if (availableToday) params.set('availableToday', 'true');

            const res = await fetch(`/api/public/discover?${params.toString()}`);
            const data = await res.json();
            if (isMountedRef.current) {
                setTutors(data.tutors || []);
                setHasSearched(true);
            }
        } catch (err) {
            console.error('[Discovery] Fetch error:', err);
            if (isMountedRef.current) {
                setTutors([]);
                setHasSearched(true);
            }
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, [userLat, userLng, category, searchQuery, sort, minRating, availableToday]);

    useEffect(() => {
        if (!showGeoModal) fetchTutors();
    }, [fetchTutors, showGeoModal]);

    useEffect(() => {
        return () => { isMountedRef.current = false; };
    }, []);

    return (
        <main className="min-h-screen bg-rizq-surface transition-colors duration-300">
            {/* Geo Permission Modal */}
            {showGeoModal && (
                <GeoPermissionModal onAllow={handleGeoAllow} onSkip={handleGeoSkip} />
            )}

            {/* ──── Header ──── */}
            <header className="sticky top-0 z-40 bg-rizq-surface/80 backdrop-blur-xl border-b border-rizq-border transition-colors duration-300">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-rizq-primary">
                            {tc('app_name')}
                        </h1>
                        <p className="text-[10px] font-medium text-rizq-text-muted">
                            {t('subtitle')}
                        </p>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* ──── Search Bar ──── */}
                <SearchBar onSearch={setSearchQuery} />

                {/* ──── Category Bar ──── */}
                <CategoryBar selected={category} onSelect={setCategory} />

                {/* ──── Filter Controls ──── */}
                <FilterControls
                    sort={sort}
                    onSortChange={setSort}
                    minRating={minRating}
                    onMinRatingChange={setMinRating}
                    availableToday={availableToday}
                    onAvailableTodayChange={setAvailableToday}
                />

                {/* ──── Results ──── */}
                <div className="space-y-3 pb-8">
                    {/* Loading skeleton */}
                    {loading && (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl p-4 animate-pulse bg-rizq-surface-elevated border border-rizq-border"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-rizq-input-bg" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 rounded-md w-32 bg-rizq-input-bg" />
                                            <div className="h-3 rounded-md w-48 bg-rizq-border" />
                                            <div className="h-3 rounded-md w-24 bg-rizq-border" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Results */}
                    {!loading && tutors.map((tutor) => (
                        <TutorCard key={tutor.id} tutor={tutor} />
                    ))}

                    {/* Empty state */}
                    {!loading && hasSearched && tutors.length === 0 && (
                        <div className="text-center py-12 space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl bg-rizq-surface-elevated border border-rizq-border">
                                🔍
                            </div>
                            <p className="text-sm font-medium text-rizq-text-muted">
                                {t('no_results')}
                            </p>
                            <p className="text-xs text-rizq-text-muted/60">
                                {t('no_results_hint')}
                            </p>
                        </div>
                    )}

                    {/* Result count */}
                    {!loading && tutors.length > 0 && (
                        <p className="text-center text-[11px] pt-2 text-rizq-text-muted/60">
                            {t('result_count', { count: tutors.length })}
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
