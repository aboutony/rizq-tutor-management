'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

const CATEGORIES = [
    { key: 'all', icon: '✨', enum: null },
    { key: 'academic', icon: '📐', enum: 'academic' },
    { key: 'music', icon: '🎵', enum: 'music' },
    { key: 'language', icon: '🌐', enum: 'language' },
    { key: 'fine_arts', icon: '🎨', enum: 'fine_arts' },
] as const;

interface CategoryBarProps {
    selected: string | null;
    onSelect: (category: string | null) => void;
}

export default function CategoryBar({ selected, onSelect }: CategoryBarProps) {
    const t = useTranslations('student_flow.discovery');

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
            {CATEGORIES.map((cat) => {
                const isActive = selected === cat.enum;
                return (
                    <button
                        key={cat.key}
                        onClick={() => onSelect(cat.enum)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border
              ${isActive
                                ? 'bg-rizq-primary text-white border-rizq-primary shadow-lg shadow-rizq-primary/20 scale-[1.03]'
                                : 'bg-rizq-surface-elevated text-rizq-text-muted border-rizq-border hover:bg-rizq-border'
                            }`}
                        style={{ scrollSnapAlign: 'start' }}
                    >
                        <span className="text-base">{cat.icon}</span>
                        {t(`categories.${cat.key}`)}
                    </button>
                );
            })}
        </div>
    );
}
