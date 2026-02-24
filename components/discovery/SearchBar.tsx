'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const t = useTranslations('student_flow.discovery');
    const [value, setValue] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onSearch(value), 300);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [value, onSearch]);

    return (
        <div className="relative flex items-center rounded-xl overflow-hidden bg-rizq-input-bg border border-rizq-input-border transition-colors duration-300">
            <svg
                className="absolute left-3 text-rizq-text-muted"
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
            >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-transparent text-rizq-text text-sm py-3 pl-10 pr-4 outline-none placeholder:text-rizq-text-muted/50 focus:ring-2 focus:ring-rizq-primary/30 rounded-xl transition-colors"
            />
            {value.length > 0 && (
                <button
                    onClick={() => setValue('')}
                    className="absolute right-3 w-5 h-5 rounded-full flex items-center justify-center bg-rizq-border text-rizq-text-muted hover:bg-rizq-text-muted/30"
                >
                    <span className="text-xs">✕</span>
                </button>
            )}
        </div>
    );
}
