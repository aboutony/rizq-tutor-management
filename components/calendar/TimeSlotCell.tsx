"use client";

import React from "react";

interface TimeSlotCellProps {
    slotKey: string;
    hour: number;
    isAvailable: boolean;
    logistics: "home" | "studio";
    sessionStatus?: "confirmed" | "pending" | null;
    sessionLabel?: string;
    isDragTarget: boolean;
    onToggle: (key: string) => void;
    onPointerDown: (key: string) => void;
    onPointerEnter: (key: string) => void;
}

export function TimeSlotCell({
    slotKey,
    hour,
    isAvailable,
    logistics,
    sessionStatus,
    sessionLabel,
    isDragTarget,
    onToggle,
    onPointerDown,
    onPointerEnter,
}: TimeSlotCellProps) {
    // Determine visual state
    let bgClass = "bg-rizq-surface-elevated/60";
    let borderClass = "border-rizq-border/30";
    let textClass = "text-rizq-text-muted";
    let glowClass = "";

    if (sessionStatus === "confirmed") {
        bgClass = "bg-emerald-500/20";
        borderClass = "border-emerald-400/50";
        textClass = "text-emerald-600 dark:text-emerald-400";
        glowClass = "shadow-[0_0_12px_rgba(16,185,129,0.25)]";
    } else if (sessionStatus === "pending") {
        bgClass = "bg-amber-500/20";
        borderClass = "border-amber-400/50";
        textClass = "text-amber-600 dark:text-amber-400";
        glowClass = "animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]";
    } else if (isAvailable) {
        bgClass = "bg-rizq-primary/15";
        borderClass = "border-rizq-primary/40";
        textClass = "text-rizq-primary";
        glowClass = "shadow-[0_0_8px_rgba(37,99,235,0.2)]";
    }

    if (isDragTarget) {
        bgClass = "bg-rizq-primary/30";
        borderClass = "border-rizq-primary/60";
    }

    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";

    return (
        <div
            className={`
                relative rounded-lg border backdrop-blur-sm
                transition-all duration-150 ease-out cursor-pointer
                touch-none select-none
                min-h-[44px] flex items-center justify-center
                ${bgClass} ${borderClass} ${glowClass}
                hover:scale-[1.02] active:scale-[0.97]
            `}
            onClick={() => onToggle(slotKey)}
            onPointerDown={(e) => {
                e.preventDefault();
                onPointerDown(slotKey);
            }}
            onPointerEnter={() => onPointerEnter(slotKey)}
            role="button"
            aria-pressed={isAvailable}
            aria-label={`${displayHour} ${ampm} - ${isAvailable ? "available" : "unavailable"}`}
        >
            {sessionStatus && sessionLabel ? (
                <span className={`text-[10px] font-semibold leading-tight text-center px-1 ${textClass}`}>
                    {sessionLabel}
                </span>
            ) : isAvailable ? (
                <div className="flex flex-col items-center gap-0.5">
                    <div className={`w-2 h-2 rounded-full ${logistics === "studio"
                            ? "bg-rizq-secondary"
                            : "bg-rizq-primary"
                        }`} />
                    <span className={`text-[9px] font-medium ${textClass}`}>
                        {logistics === "studio" ? "🎨" : "🏠"}
                    </span>
                </div>
            ) : null}
        </div>
    );
}
