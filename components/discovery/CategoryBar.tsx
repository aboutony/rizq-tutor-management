'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

/**
 * 9-Pillar Category Bar, synced with CURRICULUM_SCHEMA from curriculum-lb.ts.
 * Each pillar maps to a dbCategory for API filtering + the pillar ID for label-level filtering.
 */
const PILLARS = [
    { key: 'all', icon: '✨', pillarId: null, dbCategory: null },
    { key: 'general_education', icon: '🎓', pillarId: 'general_education', dbCategory: 'academic' },
    { key: 'tvet', icon: '🔧', pillarId: 'tvet', dbCategory: 'academic' },
    { key: 'brevet', icon: '📝', pillarId: 'brevet', dbCategory: 'academic' },
    { key: 'lebanese_bac', icon: '🏛️', pillarId: 'lebanese_bac', dbCategory: 'academic' },
    { key: 'coding_tech', icon: '💻', pillarId: 'coding_tech', dbCategory: 'academic' },
    { key: 'languages', icon: '🌐', pillarId: 'languages', dbCategory: 'language' },
    { key: 'arts_creative', icon: '🎨', pillarId: 'arts_creative', dbCategory: 'fine_arts' },
    { key: 'sports_fitness', icon: '⚽', pillarId: 'sports_fitness', dbCategory: 'fine_arts' },
    { key: 'culinary', icon: '👨‍🍳', pillarId: 'culinary', dbCategory: 'fine_arts' },
] as const;

// Map pillar labels for i18n lookup. Keys match curriculum-lb.ts labels.
const PILLAR_LABELS: Record<string, string> = {
    all: 'All',
    general_education: 'General Education',
    tvet: 'TVET',
    brevet: 'Brevet',
    lebanese_bac: 'Baccalaureate',
    coding_tech: 'Coding & Tech',
    languages: 'Languages',
    arts_creative: 'Arts & Creative',
    sports_fitness: 'Sports & Fitness',
    culinary: 'Culinary Arts',
};

interface CategoryBarProps {
    selected: string | null;
    onSelect: (category: string | null) => void;
}

export default function CategoryBar({ selected, onSelect }: CategoryBarProps) {
    const t = useTranslations('student_flow.discovery');

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
            {PILLARS.map((pillar) => {
                const isActive = selected === pillar.pillarId;
                // Try i18n key first, fallback to hardcoded label
                let label: string;
                try {
                    label = t(`categories.${pillar.key}`);
                } catch {
                    label = PILLAR_LABELS[pillar.key] || pillar.key;
                }
                return (
                    <button
                        key={pillar.key}
                        onClick={() => onSelect(pillar.pillarId)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border
              ${isActive
                                ? 'bg-rizq-primary text-white border-rizq-primary shadow-lg shadow-rizq-primary/20 scale-[1.03]'
                                : 'bg-rizq-surface-elevated text-rizq-text-muted border-rizq-border hover:bg-rizq-border'
                            }`}
                        style={{ scrollSnapAlign: 'start' }}
                    >
                        <span className="text-sm">{pillar.icon}</span>
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
