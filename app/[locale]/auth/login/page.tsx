"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const COUNTRY_CODES = [
    { code: "+961", country: "LB", label: "🇱🇧 +961" },
    { code: "+966", country: "SA", label: "🇸🇦 +966" },
    { code: "+971", country: "AE", label: "🇦🇪 +971" },
    { code: "+33", country: "FR", label: "🇫🇷 +33" },
    { code: "+1", country: "US", label: "🇺🇸 +1" },
    { code: "+44", country: "UK", label: "🇬🇧 +44" },
    { code: "+962", country: "JO", label: "🇯🇴 +962" },
    { code: "+20", country: "EG", label: "🇪🇬 +20" },
];

type UserRole = "TUTOR" | "STUDENT_PARENT";

export default function LoginPage() {
    const t = useTranslations("auth");
    const tc = useTranslations("common");
    const params = useParams();
    const router = useRouter();
    const locale = params.locale as string;

    const [countryCode, setCountryCode] = useState("+961");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<UserRole>("TUTOR");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const fullPhone = `${countryCode}${phone.replace(/\D/g, "")}`;
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone, role }),
            });

            if (res.ok) {
                // Save phone + role in sessionStorage for the verify page
                sessionStorage.setItem("rizq_auth_phone", fullPhone);
                sessionStorage.setItem("rizq_auth_role", role);
                router.replace(`/${locale}/auth/verify`);
            } else {
                const data = await res.json();
                if (res.status === 429) {
                    setError(t("error_rate_limit"));
                } else if (res.status === 404) {
                    setError(t("error_not_found"));
                } else {
                    setError(data.message || t("error_generic"));
                }
            }
        } catch {
            setError(t("error_generic"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-rizq-surface flex flex-col items-center justify-center px-4 py-8">
            {/* Theme toggle in corner */}
            <div className="fixed top-4 right-4 rtl:right-auto rtl:left-4 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-sm animate-fade-in">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-rizq-primary tracking-tight">
                        {tc("app_name")}
                    </h1>
                    <p className="mt-2 text-rizq-text-muted text-sm">
                        {t("login_title")}
                    </p>
                </div>

                {/* Login Card */}
                <div className="card space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selector */}
                        <div>
                            <label className="block text-sm font-medium text-rizq-text-muted mb-2">
                                {t("select_role")}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole("TUTOR")}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${role === "TUTOR"
                                            ? "bg-rizq-primary text-white shadow-lg shadow-rizq-primary/25"
                                            : "bg-rizq-input-bg text-rizq-text-muted border border-rizq-border hover:border-rizq-primary"
                                        }`}
                                >
                                    {t("role_tutor")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole("STUDENT_PARENT")}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${role === "STUDENT_PARENT"
                                            ? "bg-rizq-primary text-white shadow-lg shadow-rizq-primary/25"
                                            : "bg-rizq-input-bg text-rizq-text-muted border border-rizq-border hover:border-rizq-primary"
                                        }`}
                                >
                                    {t("role_student_parent")}
                                </button>
                            </div>
                        </div>

                        {/* Phone Input */}
                        <div>
                            <label
                                htmlFor="phone-input"
                                className="block text-sm font-medium text-rizq-text-muted mb-2"
                            >
                                {t("phone_label")}
                            </label>
                            <div className="flex gap-2">
                                {/* Country Code Selector */}
                                <select
                                    id="country-code-select"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="input-field w-28 shrink-0 text-sm"
                                >
                                    {COUNTRY_CODES.map((cc) => (
                                        <option key={cc.code} value={cc.code}>
                                            {cc.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Phone Number */}
                                <input
                                    id="phone-input"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder={t("phone_placeholder")}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="input-field flex-1"
                                    autoComplete="tel"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-rizq-danger/10 border border-rizq-danger/20 text-rizq-danger rounded-xl px-4 py-3 text-sm animate-fade-in">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !phone.trim()}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            className="opacity-25"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            className="opacity-75"
                                        />
                                    </svg>
                                    {t("sending")}
                                </span>
                            ) : (
                                t("send_otp")
                            )}
                        </button>
                    </form>
                </div>

                {/* Language Switcher */}
                <div className="mt-6 flex justify-center gap-4">
                    {["en", "ar", "fr"].map((l) => (
                        <a
                            key={l}
                            href={`/${l}/auth/login`}
                            className={`text-sm font-medium transition-colors duration-200 ${locale === l
                                ? "text-rizq-primary"
                                : "text-rizq-text-muted hover:text-rizq-text"
                                }`}
                        >
                            {l === "en" ? "English" : l === "ar" ? "العربية" : "Français"}
                        </a>
                    ))}
                </div>
            </div>
        </main>
    );
}
