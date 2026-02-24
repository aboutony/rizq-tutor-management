import React from "react";
import { getSessionFromCookie } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardGuardWrapper } from "./DashboardGuardWrapper";

export default async function DashboardLayout({
    children,
    params: { locale },
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const session = await getSessionFromCookie();

    if (!session) {
        redirect(`/${locale}/auth/login`);
    }

    return (
        <DashboardGuardWrapper role={session.role} locale={locale}>
            {children}
        </DashboardGuardWrapper>
    );
}
