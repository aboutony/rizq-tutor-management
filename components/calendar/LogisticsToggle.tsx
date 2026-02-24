"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface LogisticsToggleProps {
    value: "home" | "studio";
    onChange: (value: "home" | "studio") => void;
}

export function LogisticsToggle({ value, onChange }: LogisticsToggleProps) {
    const t = useTranslations("tutor_flow.calendar");
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (showConfirm) {
            const timer = setTimeout(() => setShowConfirm(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showConfirm]);

    const handleStudioSelect = () => {
        onChange("studio");
        setShowConfirm(true);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-rizq-surface-elevated border border-rizq-border/50">
                <button
                    type="button"
                    onClick={() => { onChange("home"); setShowConfirm(false); }}
                    className={`
                        flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium
                        transition-all duration-200
                        ${value === "home"
                            ? "bg-rizq-primary text-white shadow-sm"
                            : "text-rizq-text-muted hover:text-rizq-text"
                        }
                    `}
                >
                    <span>🏠</span>
                    <span>{t("home_visit")}</span>
                </button>
                <button
                    type="button"
                    onClick={handleStudioSelect}
                    className={`
                        flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium
                        transition-all duration-200
                        ${value === "studio"
                            ? "bg-rizq-secondary text-white shadow-sm"
                            : "text-rizq-text-muted hover:text-rizq-text"
                        }
                    `}
                >
                    <span>🎨</span>
                    <span>{t("studio")}</span>
                </button>
            </div>

            {/* Studio confirmation toast */}
            {showConfirm && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                    bg-rizq-secondary/90 backdrop-blur-lg text-white rounded-xl
                    px-4 py-2.5 shadow-2xl border border-white/10
                    animate-fade-in min-w-[200px]"
                >
                    <p className="text-xs font-bold">{t("studio_confirm_title")}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">{t("studio_confirm_body")}</p>
                </div>
            )}
        </div>
    );
}
