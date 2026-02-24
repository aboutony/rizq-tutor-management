import React from "react";

// This root layout is intentionally minimal.
// The actual layout logic lives in app/[locale]/layout.tsx
// which handles i18n, theme, and viewport configuration.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
