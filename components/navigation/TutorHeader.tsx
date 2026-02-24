'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export function TutorHeader() {
    const t = useTranslations('tutor_flow.nav');
    const tc = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [menuOpen]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/session', { method: 'DELETE' });
        } catch {
            // Cookie might be httpOnly, clearing manually won't work either
        }
        // Navigate to language gateway (root)
        window.location.href = '/';
    };

    return (
        <header className="sticky top-0 z-50 bg-rizq-surface/80 backdrop-blur-xl border-b border-rizq-border transition-colors duration-300">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo — links to dashboard */}
                <button
                    onClick={() => router.push(`/${locale}/dashboard/tutor`)}
                    className="flex flex-col"
                >
                    <span className="text-xl font-bold text-rizq-primary">{tc('app_name')}</span>
                    <span className="text-[10px] font-medium text-rizq-text-muted">{t('tutor_portal')}</span>
                </button>

                {/* Right: Theme Toggle + User Menu */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {/* User avatar dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-rizq-primary/10 text-rizq-primary border border-rizq-primary/20 text-sm font-bold hover:bg-rizq-primary/20 transition-all"
                            aria-label="User menu"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rizq-primary">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </button>

                        {/* Dropdown */}
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-rizq-surface-elevated border border-rizq-border shadow-xl animate-fade-in overflow-hidden z-50">
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        router.push(`/${locale}/dashboard/tutor/profile`);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rizq-text hover:bg-rizq-primary/5 transition-colors"
                                >
                                    <span className="text-base">👤</span>
                                    {t('my_profile')}
                                </button>
                                <div className="border-t border-rizq-border" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rizq-danger hover:bg-rizq-danger/5 transition-colors"
                                >
                                    <span className="text-base">🚪</span>
                                    {t('logout')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
