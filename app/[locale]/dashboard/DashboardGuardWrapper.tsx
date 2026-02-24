"use client";

import React from "react";
import { RouteGuard } from "@/components/RouteGuard";

interface DashboardGuardWrapperProps {
    role: "TUTOR" | "STUDENT_PARENT";
    locale: string;
    children: React.ReactNode;
}

/**
 * Client component wrapper that provides the RouteGuard
 * with the server-verified role. This is needed because
 * RouteGuard uses client-side hooks (useEffect, useRouter)
 * but the role must come from the server-side session.
 */
export function DashboardGuardWrapper({
    role,
    locale,
    children,
}: DashboardGuardWrapperProps) {
    return (
        <RouteGuard role={role} locale={locale}>
            {children}
        </RouteGuard>
    );
}
