'use client';

import React from 'react';
import { TutorHeader } from '@/components/navigation/TutorHeader';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function TutorLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-rizq-surface transition-colors duration-300">
            <TutorHeader />
            <div className="pb-20">
                {children}
            </div>
            <BottomNav />
        </div>
    );
}
