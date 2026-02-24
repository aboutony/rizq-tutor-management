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
            (pos) => {
                onAllow(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
                setLoading(false);
                onSkip();
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <div
                className="w-full max-w-sm rounded-2xl p-6 text-center space-y-5 animate-fade-in"
                style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
            >
                {/* Radar icon */}
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))',
                        border: '1px solid rgba(59,130,246,0.3)',
                        animation: 'pulse 2s ease-in-out infinite',
                    }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,1)" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M8.1 15.9A5.5 5.5 0 0 1 6.5 12c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5a5.5 5.5 0 0 1-1.6 3.9" />
                        <path d="M5.6 18.4A9 9 0 0 1 3 12c0-5 4-9 9-9s9 4 9 9a9 9 0 0 1-2.6 6.4" />
                    </svg>
                </div>

                <h3 className="text-lg font-bold text-white">
                    {t('geo_title')}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {t('geo_body')}
                </p>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onSkip}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        {t('geo_skip')}
                    </button>
                    <button
                        onClick={handleAllow}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? t('geo_locating') : t('geo_allow')}
                    </button>
                </div>
            </div>
        </div>
    );
}
