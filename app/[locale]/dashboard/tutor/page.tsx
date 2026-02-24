"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TutorCalendar, SlotData, SessionData } from "@/components/calendar/TutorCalendar";
import { CalendarSummary } from "@/components/calendar/CalendarSummary";

export default function TutorDashboard() {
    const t = useTranslations("tutor_flow.calendar");
    const tc = useTranslations("common");

    const [slots, setSlots] = useState<Record<string, SlotData>>({});
    const [sessions, setSessions] = useState<Record<string, SessionData>>({});
    const [summary, setSummary] = useState({ confirmed: 0, pending: 0, available: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch availability and sessions on mount
    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/tutor/availability", {
                    cache: "no-store",
                    credentials: "same-origin",
                });
                if (res.ok) {
                    const data = await res.json();
                    setSlots(data.slots || {});
                    setSessions(data.sessions || {});
                    setSummary(data.summary || { confirmed: 0, pending: 0, available: 0 });
                }
            } catch (err) {
                console.error("Failed to fetch availability:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Save handler
    const handleSave = useCallback(async (updatedSlots: Record<string, SlotData>) => {
        const res = await fetch("/api/tutor/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slots: updatedSlots }),
            credentials: "same-origin",
        });

        if (!res.ok) {
            throw new Error("Failed to save");
        }

        const data = await res.json();
        // Update available count
        setSummary((prev) => ({
            ...prev,
            available: data.count || Object.values(updatedSlots).filter((s) => s.available).length,
        }));
    }, []);

    return (
        <main className="min-h-screen bg-rizq-surface">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-rizq-surface/80 backdrop-blur-xl border-b border-rizq-border">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-rizq-primary">
                            {tc("app_name")}
                        </h1>
                        <p className="text-[10px] text-rizq-text-muted font-medium">
                            {t("title")}
                        </p>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
                {isLoading ? (
                    /* Skeleton loader */
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-20 rounded-2xl bg-rizq-surface-elevated animate-pulse"
                                />
                            ))}
                        </div>
                        <div className="h-96 rounded-2xl bg-rizq-surface-elevated animate-pulse" />
                    </div>
                ) : (
                    <>
                        {/* Summary Section */}
                        <CalendarSummary
                            confirmedCount={summary.confirmed}
                            pendingCount={summary.pending}
                            availableCount={summary.available}
                        />

                        {/* Calendar Grid */}
                        <div className="card !p-4">
                            <TutorCalendar
                                initialSlots={slots}
                                sessions={sessions}
                                onSave={handleSave}
                            />
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
