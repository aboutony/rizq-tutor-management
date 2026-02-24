import React from "react";
import "./globals.css";

// Root layout imports globals.css to ensure Tailwind is compiled.
// The [locale] layout provides <html> and <body> with locale-specific
// lang/dir attributes, i18n, theme, and viewport configuration.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
