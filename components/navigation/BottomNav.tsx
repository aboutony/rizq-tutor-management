'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const TABS = [
    { key: 'home', icon: '🏠', path: '' },
    { key: 'schedule', icon: '📅', path: '/schedule' },
    { key: 'messages', icon: '💬', path: '/messages' },
] as const;

export function BottomNav() {
    const t = useTranslations('tutor_flow.nav');
    const locale = useLocale();
    const pathname = usePathname();

    const basePath = `/${locale}/dashboard/tutor`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-rizq-surface/90 backdrop-blur-xl border-t border-rizq-border transition-colors duration-300">
            <div className="max-w-lg mx-auto flex items-center justify-around">
                {TABS.map((tab) => {
                    const href = `${basePath}${tab.path}`;
                    // Active if exact match or prefix match for sub-routes
                    const isActive = tab.path === ''
                        ? pathname === basePath || pathname === `${basePath}/`
                        : pathname.startsWith(href);

                    return (
                        <Link
                            key={tab.key}
                            href={href}
                            className={`flex flex-col items-center gap-1 py-3 px-5 transition-all ${isActive ? 'text-rizq-primary' : 'text-rizq-text-muted'
                                }`}
                        >
                            <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                                {tab.icon}
                            </span>
                            <span className={`text-[10px] font-semibold ${isActive ? 'text-rizq-primary' : ''}`}>
                                {t(`tab_${tab.key}`)}
                            </span>
                            {/* Active indicator dot */}
                            {isActive && (
                                <span className="w-1 h-1 rounded-full bg-rizq-primary -mt-0.5" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
