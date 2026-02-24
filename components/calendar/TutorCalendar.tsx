"use client";

import React, { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { TimeSlotCell } from "./TimeSlotCell";
import { LogisticsToggle } from "./LogisticsToggle";

// Day mapping: 0=Sun...6=Sat, matching DB schema
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8AM to 8PM

export interface SlotData {
    available: boolean;
    logistics: "home" | "studio";
}

export interface SessionData {
    status: "confirmed" | "pending";
    label: string;
}

interface TutorCalendarProps {
    /** Initial availability from API */
    initialSlots?: Record<string, SlotData>;
    /** Booked sessions overlay */
    sessions?: Record<string, SessionData>;
    /** Called when user saves */
    onSave?: (slots: Record<string, SlotData>) => Promise<void>;
}

export function TutorCalendar({
    initialSlots = {},
    sessions = {},
    onSave,
}: TutorCalendarProps) {
    const t = useTranslations("tutor_flow.calendar");
    const td = useTranslations("common.days");

    const [slots, setSlots] = useState<Record<string, SlotData>>(initialSlots);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // Drag state
    const isDragging = useRef(false);
    const dragTargets = useRef<Set<string>>(new Set());
    const dragMode = useRef<boolean>(true); // true = setting available, false = clearing
    const [dragSet, setDragSet] = useState<Set<string>>(new Set());

    const getSlot = (key: string): SlotData => {
        return slots[key] || { available: false, logistics: "home" };
    };

    const toggleSlot = useCallback((key: string) => {
        if (isDragging.current) return;
        setSlots((prev) => {
            const current = prev[key] || { available: false, logistics: "home" };
            return {
                ...prev,
                [key]: { ...current, available: !current.available },
            };
        });
        setSelectedSlot(key);
    }, []);

    const handlePointerDown = useCallback((key: string) => {
        isDragging.current = true;
        const current = slots[key] || { available: false, logistics: "home" };
        dragMode.current = !current.available; // If currently off, we're toggling on
        dragTargets.current = new Set([key]);
        setDragSet(new Set([key]));
    }, [slots]);

    const handlePointerEnter = useCallback((key: string) => {
        if (!isDragging.current) return;
        dragTargets.current.add(key);
        setDragSet(new Set(dragTargets.current));
    }, []);

    const handlePointerUp = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;

        // Apply drag: toggle all dragged slots to dragMode
        if (dragTargets.current.size > 1) {
            setSlots((prev) => {
                const next = { ...prev };
                dragTargets.current.forEach((key) => {
                    const current = next[key] || { available: false, logistics: "home" };
                    next[key] = { ...current, available: dragMode.current };
                });
                return next;
            });
        }

        dragTargets.current.clear();
        setDragSet(new Set());
    }, []);

    const handleLogisticsChange = useCallback(
        (key: string, value: "home" | "studio") => {
            setSlots((prev) => ({
                ...prev,
                [key]: { ...(prev[key] || { available: true, logistics: "home" }), logistics: value },
            }));
        },
        []
    );

    const handleSave = async () => {
        if (!onSave) return;
        setIsSaving(true);
        setSaveMessage("");
        try {
            await onSave(slots);
            setSaveMessage(t("saved"));
            setTimeout(() => setSaveMessage(""), 3000);
        } catch {
            setSaveMessage("Error saving. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const selectedSlotData = selectedSlot ? getSlot(selectedSlot) : null;

    return (
        <div
            className="space-y-4"
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Week header + instruction */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-rizq-text">{t("week_view")}</h3>
                <p className="text-[10px] text-rizq-text-muted">{t("drag_to_select")}</p>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
                <div className="min-w-[600px]">
                    {/* Day Headers */}
                    <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
                        <div /> {/* Time column spacer */}
                        {DAY_KEYS.map((dayKey) => (
                            <div
                                key={dayKey}
                                className="text-center text-[11px] font-bold text-rizq-text-muted uppercase tracking-wider py-2"
                            >
                                {td(dayKey)}
                            </div>
                        ))}
                    </div>

                    {/* Time rows */}
                    {HOURS.map((hour) => (
                        <div key={hour} className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
                            {/* Time label */}
                            <div className="flex items-center justify-end pr-2">
                                <span className="text-[10px] font-medium text-rizq-text-muted tabular-nums">
                                    {hour > 12 ? hour - 12 : hour}
                                    <span className="text-[8px] ml-0.5">{hour >= 12 ? t("pm") : t("am")}</span>
                                </span>
                            </div>

                            {/* Day cells */}
                            {DAY_KEYS.map((dayKey, dayIndex) => {
                                const slotKey = `${dayIndex}-${hour}:00`;
                                const slotData = getSlot(slotKey);
                                const session = sessions[slotKey] || null;

                                return (
                                    <TimeSlotCell
                                        key={slotKey}
                                        slotKey={slotKey}
                                        hour={hour}
                                        isAvailable={slotData.available}
                                        logistics={slotData.logistics}
                                        sessionStatus={session?.status || null}
                                        sessionLabel={session?.label}
                                        isDragTarget={dragSet.has(slotKey)}
                                        onToggle={toggleSlot}
                                        onPointerDown={handlePointerDown}
                                        onPointerEnter={handlePointerEnter}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Logistics toggle for selected available slot */}
            {selectedSlot && selectedSlotData?.available && (
                <div className="flex items-center justify-center gap-3 py-2 animate-fade-in">
                    <span className="text-xs font-medium text-rizq-text-muted">
                        {t("logistics_label")}:
                    </span>
                    <LogisticsToggle
                        value={selectedSlotData.logistics}
                        onChange={(val) => handleLogisticsChange(selectedSlot, val)}
                    />
                </div>
            )}

            {/* Save button */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isSaving ? (
                    <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t("saving")}
                    </>
                ) : (
                    t("save_availability")
                )}
            </button>

            {/* Save success message */}
            {saveMessage && (
                <p className="text-center text-sm font-medium text-rizq-success animate-fade-in">
                    {saveMessage}
                </p>
            )}
        </div>
    );
}
