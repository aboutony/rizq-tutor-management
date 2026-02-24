import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import React from "react";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

const locales = ["en", "ar", "fr"];

export const metadata: Metadata = {
    title: "RIZQ",
    description: "Protecting a tutor's time and income.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default async function LocaleLayout({
    children,
    params: { locale },
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    // Validate locale
    if (!locales.includes(locale)) {
        notFound();
    }

    const messages = await getMessages();
    const dir = locale === "ar" ? "rtl" : "ltr";

    return (
        <html lang={locale} dir={dir} suppressHydrationWarning>
            <body className={inter.className}>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider>{children}</ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
