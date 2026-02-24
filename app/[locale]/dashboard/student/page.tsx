"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function StudentDashboard() {
    const t = useTranslations("student_flow.dashboard");
    const tc = useTranslations("common");

    return (
        <main className="min-h-screen bg-rizq-surface">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-rizq-surface/80 backdrop-blur-xl border-b border-rizq-border">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-rizq-primary">
                        {tc("app_name")}
                    </h1>
                    <ThemeToggle />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-fade-in">
                {/* Welcome Card */}
                <div className="card bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-0">
                    <h2 className="text-lg font-bold">{t("my_lessons")}</h2>
                    <p className="text-white/70 text-sm mt-1">
                        Student/Parent Dashboard — Sprint 1 Placeholder
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="card text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-rizq-text">{t("find_tutor")}</p>
                    </div>
                    <div className="card text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-rizq-text">{t("upcoming")}</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
