'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface GeoPermissionModalProps {
    onAllow: (lat: number, lng: number) => void;
    onSkip: () => void;
}

export default function GeoPermissionModal({ onAllow, onSkip }: GeoPermissionModalProps) {
    const t = useTranslations('student_flow.discovery');
    const [loading, setLoading] = React.useState(false);

    const handleAllow = () => {
        setLoading(true);
        if (!navigator.geolocation) {
            onSkip();
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => onAllow(pos.coords.latitude, pos.coords.longitude),
            () => { setLoading(false); onSkip(); },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl p-6 text-center space-y-5 animate-fade-in bg-rizq-surface-elevated border border-rizq-border shadow-2xl">
                {/* Radar icon */}
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-rizq-primary/10 border border-rizq-primary/20">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rizq-primary">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M8.1 15.9A5.5 5.5 0 0 1 6.5 12c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5a5.5 5.5 0 0 1-1.6 3.9" />
                        <path d="M5.6 18.4A9 9 0 0 1 3 12c0-5 4-9 9-9s9 4 9 9a9 9 0 0 1-2.6 6.4" />
                    </svg>
                </div>

                <h3 className="text-lg font-bold text-rizq-text">
                    {t('geo_title')}
                </h3>
                <p className="text-sm leading-relaxed text-rizq-text-muted">
                    {t('geo_body')}
                </p>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onSkip}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-rizq-input-bg text-rizq-text-muted border border-rizq-border transition-all hover:bg-rizq-border"
                    >
                        {t('geo_skip')}
                    </button>
                    <button
                        onClick={handleAllow}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-rizq-primary hover:bg-rizq-primary-hover transition-all disabled:opacity-60 shadow-lg shadow-rizq-primary/20"
                    >
                        {loading ? t('geo_locating') : t('geo_allow')}
                    </button>
                </div>
            </div>
        </div>
    );
}
