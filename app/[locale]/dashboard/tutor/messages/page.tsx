'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function MessagesPage() {
    const t = useTranslations('tutor_flow.nav');

    return (
        <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl bg-rizq-surface-elevated border border-rizq-border">
                💬
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-rizq-text">{t('messages_title')}</h2>
                <p className="text-sm text-rizq-text-muted">{t('messages_coming_soon')}</p>
            </div>
            <div className="card inline-flex items-center gap-2 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-rizq-primary animate-pulse" />
                <span className="text-xs font-medium text-rizq-text-muted">{t('messages_status')}</span>
            </div>
        </div>
    );
}
