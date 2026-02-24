"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface CalendarSummaryProps {
    confirmedCount: number;
    pendingCount: number;
    availableCount: number;
}

export function CalendarSummary({ confirmedCount, pendingCount, availableCount }: CalendarSummaryProps) {
    const t = useTranslations("tutor_flow.calendar");

    return (
        <div className="grid grid-cols-3 gap-3">
            {/* Confirmed Sessions */}
            <div className="relative overflow-hidden rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-4 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-400/10 rounded-full -translate-y-4 translate-x-4" />
                <div className="relative">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {confirmedCount}
                    </p>
                    <p className="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                        {t("confirmed_sessions")}
                    </p>
                </div>
            </div>

            {/* Pending Requests */}
            <div className={`
                relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-400/30 p-4 backdrop-blur-sm
                ${pendingCount > 0 ? "ring-2 ring-amber-400/40 ring-offset-1 ring-offset-rizq-surface" : ""}
            `}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-full -translate-y-4 translate-x-4" />
                <div className="relative">
                    <p className={`text-2xl font-bold text-amber-600 dark:text-amber-400 ${pendingCount > 0 ? "animate-pulse" : ""}`}>
                        {pendingCount}
                    </p>
                    <p className="text-[11px] font-medium text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                        {t("pending_requests")}
                    </p>
                </div>
            </div>

            {/* Available Slots */}
            <div className="relative overflow-hidden rounded-2xl bg-rizq-primary/10 border border-rizq-primary/30 p-4 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-16 h-16 bg-rizq-primary/10 rounded-full -translate-y-4 translate-x-4" />
                <div className="relative">
                    <p className="text-2xl font-bold text-rizq-primary">
                        {availableCount}
                    </p>
                    <p className="text-[11px] font-medium text-rizq-primary/70 mt-0.5">
                        {t("available")}
                    </p>
                </div>
            </div>
        </div>
    );
}
