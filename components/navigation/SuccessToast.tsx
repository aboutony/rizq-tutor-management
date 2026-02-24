'use client';

import React, { useEffect, useState } from 'react';

interface SuccessToastProps {
    message: string;
    visible: boolean;
    onDismiss: () => void;
    durationMs?: number;
}

export function SuccessToast({ message, visible, onDismiss, durationMs = 3000 }: SuccessToastProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            // Trigger enter animation
            requestAnimationFrame(() => setShow(true));
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onDismiss, 300); // Wait for exit animation
            }, durationMs);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [visible, durationMs, onDismiss]);

    if (!visible) return null;

    return (
        <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-full px-4 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rizq-success/15 border border-rizq-success/30 shadow-lg backdrop-blur-xl">
                <span className="text-xl">✅</span>
                <span className="text-sm font-semibold text-rizq-success flex-1">{message}</span>
                <button
                    onClick={() => {
                        setShow(false);
                        setTimeout(onDismiss, 300);
                    }}
                    className="text-rizq-success/60 hover:text-rizq-success text-xs"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
