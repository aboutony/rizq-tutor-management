"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TutorDashboard() {
    const t = useTranslations("tutor_flow.dashboard");
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
                <div className="card bg-gradient-to-br from-rizq-primary to-blue-700 text-white border-0">
                    <h2 className="text-lg font-bold">{t("lesson_log")}</h2>
                    <p className="text-white/70 text-sm mt-1">
                        Tutor Dashboard — Sprint 1 Placeholder
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="card text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-rizq-primary/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-rizq-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-rizq-text">{t("requests_inbox")}</p>
                    </div>
                    <div className="card text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-rizq-secondary/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-rizq-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-rizq-text">{t("reschedule_requests")}</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
