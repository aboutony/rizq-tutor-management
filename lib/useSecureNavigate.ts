"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * RIZQ Secure Navigation Hook
 *
 * Wraps router.replace() to ensure all in-app navigations
 * REPLACE the current history entry instead of pushing a new one.
 * This prevents the browser "Back" button from returning to
 * cross-role pages or auth-flow pages.
 *
 * Usage:
 *   const { navigate } = useSecureNavigate();
 *   navigate(`/${locale}/dashboard/tutor`);
 */
export function useSecureNavigate() {
    const router = useRouter();

    /**
     * Navigate to a path using router.replace() — the history entry
     * for the current page is destroyed, not preserved.
     */
    const navigate = useCallback(
        (path: string) => {
            router.replace(path);
        },
        [router]
    );

    return { navigate, router };
}
