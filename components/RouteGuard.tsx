"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

interface RouteGuardProps {
    /** The user's role as determined server-side */
    role: "TUTOR" | "STUDENT_PARENT";
    /** The current locale */
    locale: string;
    children: React.ReactNode;
}

/**
 * RIZQ Route Guard — Client-Side Security Layer
 *
 * This component enforces 4 security invariants on every navigation event:
 *
 * 1. POPSTATE INTERCEPTION: When the browser "Back" button fires a popstate event
 *    that would land on a cross-role URL OR a legacy route OR an auth-flow page,
 *    we immediately replace the history entry and navigate to the correct dashboard home.
 *
 * 2. HISTORY PURGE: On mount and on every pathname change, we call
 *    history.replaceState to ensure the current entry never contains a
 *    cross-dashboard URL in the history stack.
 *
 * 3. REAL-TIME SESSION CHECK: On every navigation event, we ping /api/auth/session
 *    to verify the JWT is still valid and the role hasn't changed. If the session
 *    is invalid or the role mismatches, we force-redirect to login or the correct
 *    dashboard.
 *
 * 4. LEGACY ROUTE BLOCKING: Navigating to /tutor/* as STUDENT_PARENT, or to
 *    auth-flow pages (verify/login) from a dashboard, is treated as a violation.
 */
export function RouteGuard({ role, locale, children }: RouteGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const lastValidatedPath = useRef(pathname);

    // Compute the allowed dashboard prefix and home URL for this role
    const allowedPrefix = role === "TUTOR"
        ? `/${locale}/dashboard/tutor`
        : `/${locale}/dashboard/student`;
    const homeUrl = allowedPrefix;

    // Compute the FORBIDDEN dashboard prefix (opposite role)
    const forbiddenPrefix = role === "TUTOR"
        ? `/${locale}/dashboard/student`
        : `/${locale}/dashboard/tutor`;

    // Legacy tutor routes: STUDENT_PARENT must never reach these
    const legacyTutorPrefix = "/tutor";

    // Auth-flow pages that should not be "back-navigable" from dashboards
    const authFlowPaths = [`/${locale}/auth/verify`, `/${locale}/auth/login`];

    /**
     * Checks if a path violates the role boundary.
     * Catches: cross-role dashboard, legacy /tutor/* for non-tutors,
     * and auth-flow pages (prevents back-nav to verify/login).
     */
    const isViolation = useCallback(
        (path: string): boolean => {
            // Cross-role dashboard violation
            if (path.startsWith(forbiddenPrefix)) {
                return true;
            }

            // Legacy /tutor/* violation for STUDENT_PARENT
            if (role === "STUDENT_PARENT" && path.startsWith(legacyTutorPrefix)) {
                return true;
            }

            // Auth-flow page violation (back-nav from dashboard to verify/login)
            if (authFlowPaths.some((authPath) => path.startsWith(authPath))) {
                return true;
            }

            return false;
        },
        [forbiddenPrefix, role, authFlowPaths]
    );

    /**
     * Performs a real-time session validation against the server.
     * Returns true if the session is valid and the role matches.
     */
    const validateSession = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/auth/session", {
                cache: "no-store",
                credentials: "same-origin",
            });

            if (!res.ok) {
                // Session expired or invalid — force logout
                router.replace(`/${locale}/auth/login`);
                return false;
            }

            const data = await res.json();

            if (!data.authenticated) {
                router.replace(`/${locale}/auth/login`);
                return false;
            }

            // Role mismatch — the JWT role doesn't match what we expect
            if (data.role !== role) {
                console.warn(
                    `[RIZQ GUARD] Role mismatch: expected ${role}, got ${data.role}. Redirecting.`
                );
                const correctHome = data.role === "TUTOR"
                    ? `/${locale}/dashboard/tutor`
                    : `/${locale}/dashboard/student`;
                router.replace(correctHome);
                return false;
            }

            return true;
        } catch {
            // Network error — don't disrupt the user, but log it
            console.error("[RIZQ GUARD] Session validation failed (network error)");
            return true; // Fail open on network errors to avoid UX disruption
        }
    }, [locale, role, router]);

    /**
     * LAYER 1: Popstate interception (browser Back/Forward buttons)
     */
    useEffect(() => {
        const handlePopState = () => {
            const currentPath = window.location.pathname;

            if (isViolation(currentPath)) {
                // ── SECURITY: Cross-role / legacy / auth back-navigation detected ──
                console.warn(
                    `[RIZQ GUARD] Back-button violation: "${currentPath}" is outside ${role} boundary. Purging history.`
                );

                // Replace the offending history entry with the home URL
                window.history.replaceState(null, "", homeUrl);

                // Navigate to the correct dashboard home
                router.replace(homeUrl);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [homeUrl, isViolation, role, router]);

    /**
     * LAYER 2: Pathname change guard + history purge
     * Fires on every Next.js client-side navigation.
     */
    useEffect(() => {
        // If the current path is a violation, purge it immediately
        if (isViolation(pathname)) {
            console.warn(
                `[RIZQ GUARD] Navigation violation: "${pathname}" blocked for ${role}`
            );
            window.history.replaceState(null, "", homeUrl);
            router.replace(homeUrl);
            return;
        }

        // Validate session on path change (real-time check)
        if (pathname !== lastValidatedPath.current) {
            lastValidatedPath.current = pathname;
            validateSession();
        }
    }, [pathname, isViolation, homeUrl, role, router, validateSession]);

    /**
     * LAYER 3: Initial mount — replace current history state
     * This ensures the very first entry in the history stack is the correct
     * dashboard URL, preventing the user from going "back" to a pre-login page.
     */
    useEffect(() => {
        const currentPath = window.location.pathname;

        // If current path is itself a violation (e.g. page loaded directly), fix it
        if (isViolation(currentPath)) {
            window.history.replaceState({ rizqGuard: true, role }, "", homeUrl);
            router.replace(homeUrl);
        } else {
            // Clean the history entry so back-nav from future pages doesn't return here
            window.history.replaceState(
                { rizqGuard: true, role },
                "",
                currentPath
            );
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return <>{children}</>;
}
