"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

const OTP_LENGTH = 6;

export default function VerifyPage() {
    const t = useTranslations("auth");
    const tc = useTranslations("common");
    const params = useParams();
    const router = useRouter();
    const locale = params.locale as string;

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const phone =
        typeof window !== "undefined"
            ? sessionStorage.getItem("rizq_auth_phone") || ""
            : "";
    const role =
        typeof window !== "undefined"
            ? sessionStorage.getItem("rizq_auth_role") || "TUTOR"
            : "TUTOR";

    // Auto-focus first input
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-advance to next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits entered
        if (newOtp.every((d) => d !== "") && newOtp.join("").length === OTP_LENGTH) {
            handleVerify(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (pasted.length === OTP_LENGTH) {
            const newOtp = pasted.split("");
            setOtp(newOtp);
            inputRefs.current[OTP_LENGTH - 1]?.focus();
            handleVerify(pasted);
        }
    };

    const handleVerify = async (code: string) => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, code, role, locale }),
            });

            if (res.ok) {
                // Clear sessionStorage
                sessionStorage.removeItem("rizq_auth_phone");
                sessionStorage.removeItem("rizq_auth_role");

                // Redirect to appropriate dashboard based on role
                if (role === "STUDENT_PARENT") {
                    router.replace(`/${locale}/dashboard/student`);
                } else {
                    router.replace(`/${locale}/dashboard/tutor`);
                }
            } else {
                const data = await res.json();
                if (res.status === 401) {
                    setError(t("error_invalid_code"));
                } else {
                    setError(data.message || t("error_generic"));
                }
                setOtp(Array(OTP_LENGTH).fill(""));
                inputRefs.current[0]?.focus();
            }
        } catch {
            setError(t("error_generic"));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        try {
            await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, role }),
            });
            setResendCooldown(30);
        } catch {
            setError(t("error_generic"));
        }
    };

    // Mask phone number for display
    const maskedPhone = phone
        ? phone.slice(0, -4).replace(/./g, "•") + phone.slice(-4)
        : "";

    return (
        <main className="min-h-screen bg-rizq-surface flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rizq-primary/10 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-rizq-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-rizq-text">
                        {t("verify_title")}
                    </h1>
                    <p className="mt-2 text-rizq-text-muted text-sm">
                        {t("code_sent_to")} {maskedPhone}
                    </p>
                </div>

                {/* OTP Card */}
                <div className="card space-y-6">
                    {/* OTP Input Grid */}
                    <div
                        className="flex justify-center gap-3 dir-ltr"
                        style={{ direction: "ltr" }}
                        onPaste={handlePaste}
                    >
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => {
                                    inputRefs.current[idx] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2
                  transition-all duration-200
                  bg-rizq-input-bg text-rizq-text
                  ${digit
                                        ? "border-rizq-primary shadow-lg shadow-rizq-primary/10"
                                        : "border-rizq-input-border"
                                    }
                  focus:outline-none focus:border-rizq-primary focus:shadow-lg focus:shadow-rizq-primary/20`}
                                disabled={loading}
                                autoComplete="one-time-code"
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-rizq-danger/10 border border-rizq-danger/20 text-rizq-danger rounded-xl px-4 py-3 text-sm text-center animate-fade-in">
                            {error}
                        </div>
                    )}

                    {/* Verify Button */}
                    <button
                        onClick={() => handleVerify(otp.join(""))}
                        disabled={loading || otp.some((d) => !d)}
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
                                {t("verifying")}
                            </span>
                        ) : (
                            t("verify_button")
                        )}
                    </button>

                    {/* Resend Link */}
                    <div className="text-center">
                        <p className="text-sm text-rizq-text-muted">
                            {t("didnt_receive")}{" "}
                            <button
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                className="text-rizq-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendCooldown > 0
                                    ? `${t("resend")} (${resendCooldown}s)`
                                    : t("resend")}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <a
                        href={`/${locale}/auth/login`}
                        className="text-sm text-rizq-text-muted hover:text-rizq-text transition-colors"
                    >
                        ← {t("back_to_login")}
                    </a>
                </div>
            </div>
        </main>
    );
}
