import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";

/**
 * Root Landing Page — The Language Gateway
 *
 * Priority 1: Three glassmorphism language buttons → set locale → redirect to login
 * Priority 2: Royal Blue to Deep Indigo gradient + floating glass elements
 * Priority 3: Auto-route if user is already logged in
 */

async function getSessionRole(): Promise<{
  role: string;
  locale: string;
} | null> {
  const sessionCookie = cookies().get("rizq_session");
  if (!sessionCookie) return null;

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default-secret-key-for-dev"
    );
    const { payload } = await jose.jwtVerify(sessionCookie.value, secret);
    return {
      role: (payload.role as string) || "TUTOR",
      locale: (payload.locale as string) || "en",
    };
  } catch {
    return null;
  }
}

export default async function RootLandingPage() {
  // ── Priority 3: Auto-route logged-in users ──
  const session = await getSessionRole();
  if (session) {
    const dashboardPath =
      session.role === "TUTOR"
        ? `/${session.locale}/dashboard/tutor`
        : `/${session.locale}/dashboard/student`;
    redirect(dashboardPath);
  }

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>RIZQ — Welcome</title>
        <meta name="description" content="Protecting a tutor's time and income." />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              overflow: hidden;
              min-height: 100dvh;
            }

            .landing-wrapper {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100dvh;
              background: linear-gradient(140deg, #0a1628 0%, #0f2044 25%, #1a3a7a 50%, #2b1a5e 75%, #0a1628 100%);
              overflow: hidden;
            }

            /* Floating glass orbs */
            .glass-orb {
              position: absolute;
              border-radius: 50%;
              background: radial-gradient(ellipse at 30% 30%,
                rgba(59, 130, 246, 0.12) 0%,
                rgba(99, 102, 241, 0.06) 50%,
                transparent 70%);
              border: 1px solid rgba(255, 255, 255, 0.04);
              backdrop-filter: blur(40px);
              -webkit-backdrop-filter: blur(40px);
              pointer-events: none;
            }

            .orb-1 {
              width: 400px; height: 400px;
              top: -120px; right: -100px;
              animation: float-1 18s ease-in-out infinite;
            }
            .orb-2 {
              width: 280px; height: 280px;
              bottom: -80px; left: -60px;
              animation: float-2 22s ease-in-out infinite;
            }
            .orb-3 {
              width: 160px; height: 160px;
              top: 30%; left: 10%;
              animation: float-3 15s ease-in-out infinite;
              background: radial-gradient(ellipse at 50% 50%,
                rgba(139, 92, 246, 0.1) 0%,
                rgba(59, 130, 246, 0.05) 50%,
                transparent 70%);
            }
            .orb-4 {
              width: 200px; height: 200px;
              bottom: 20%; right: 5%;
              animation: float-1 20s ease-in-out infinite reverse;
              background: radial-gradient(ellipse at 40% 60%,
                rgba(37, 99, 235, 0.08) 0%,
                transparent 60%);
            }

            /* Glass line accents */
            .glass-line {
              position: absolute;
              background: linear-gradient(90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.05) 30%,
                rgba(255, 255, 255, 0.08) 50%,
                rgba(255, 255, 255, 0.05) 70%,
                transparent 100%);
              pointer-events: none;
            }
            .line-1 {
              width: 300px; height: 1px;
              top: 25%; left: -20px;
              transform: rotate(-15deg);
              animation: shimmer 8s ease-in-out infinite;
            }
            .line-2 {
              width: 200px; height: 1px;
              bottom: 30%; right: -10px;
              transform: rotate(20deg);
              animation: shimmer 10s ease-in-out infinite 3s;
            }

            @keyframes float-1 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(20px, -30px) scale(1.03); }
              66% { transform: translate(-15px, 15px) scale(0.97); }
            }
            @keyframes float-2 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(-25px, 20px) scale(1.05); }
              66% { transform: translate(18px, -25px) scale(0.95); }
            }
            @keyframes float-3 {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(30px, -20px); }
            }
            @keyframes shimmer {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.7; }
            }
            @keyframes fade-up {
              from { opacity: 0; transform: translateY(24px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes glow-pulse {
              0%, 100% { filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.3)); }
              50% { filter: drop-shadow(0 0 40px rgba(59, 130, 246, 0.5)); }
            }

            .content-zone {
              position: relative;
              z-index: 10;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 48px;
              padding: 24px;
              animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            /* Logo */
            .logo-zone {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
              animation: glow-pulse 4s ease-in-out infinite;
            }
            .logo-icon {
              width: 88px; height: 88px;
              border-radius: 24px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow:
                0 0 60px rgba(37, 99, 235, 0.3),
                0 0 120px rgba(37, 99, 235, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .logo-text {
              font-size: 44px;
              font-weight: 800;
              letter-spacing: -1px;
              color: white;
              text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
            }
            .tagline {
              font-size: 13px;
              font-weight: 500;
              color: rgba(255, 255, 255, 0.5);
              letter-spacing: 3px;
              text-transform: uppercase;
            }

            /* Language buttons */
            .lang-buttons {
              display: flex;
              flex-direction: column;
              gap: 14px;
              width: 100%;
              max-width: 320px;
              animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
            }

            .lang-btn {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              padding: 18px 32px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              background: rgba(255, 255, 255, 0.06);
              backdrop-filter: blur(24px);
              -webkit-backdrop-filter: blur(24px);
              color: white;
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
              text-decoration: none;
              overflow: hidden;
            }

            .lang-btn::before {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: 16px;
              background: linear-gradient(135deg,
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0) 50%);
              opacity: 0;
              transition: opacity 0.3s ease;
            }

            .lang-btn:hover {
              border-color: rgba(59, 130, 246, 0.4);
              background: rgba(59, 130, 246, 0.12);
              transform: translateY(-2px);
              box-shadow:
                0 8px 32px rgba(37, 99, 235, 0.2),
                0 0 0 1px rgba(59, 130, 246, 0.1);
            }
            .lang-btn:hover::before {
              opacity: 1;
            }

            .lang-btn:active {
              transform: translateY(0);
              transition-duration: 0.1s;
            }

            .lang-flag {
              font-size: 22px;
              line-height: 1;
            }

            .lang-btn.arabic {
              font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif;
              direction: rtl;
            }

            /* Footer */
            .footer-text {
              font-size: 11px;
              color: rgba(255, 255, 255, 0.25);
              letter-spacing: 0.5px;
              animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
            }
          `,
          }}
        />
      </head>
      <body>
        <div className="landing-wrapper">
          {/* Floating glass orbs */}
          <div className="glass-orb orb-1" />
          <div className="glass-orb orb-2" />
          <div className="glass-orb orb-3" />
          <div className="glass-orb orb-4" />

          {/* Glass line accents */}
          <div className="glass-line line-1" />
          <div className="glass-line line-2" />

          {/* Content */}
          <div className="content-zone">
            {/* RIZQ Royal Blue Logo */}
            <div className="logo-zone">
              <div className="logo-icon">
                {/* Crown / RIZQ Icon */}
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Shield shape with R letterform */}
                  <path
                    d="M22 3L6 10v12c0 9.5 6.8 18.4 16 20.5 9.2-2.1 16-11 16-20.5V10L22 3z"
                    fill="rgba(255,255,255,0.1)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                  />
                  <text
                    x="22"
                    y="29"
                    textAnchor="middle"
                    fill="white"
                    fontSize="20"
                    fontWeight="800"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    R
                  </text>
                </svg>
              </div>
              <span className="logo-text">RIZQ</span>
              <span className="tagline">Your time has value</span>
            </div>

            {/* Language Gateway Buttons */}
            <div className="lang-buttons">
              <a href="/en/auth/login" className="lang-btn" id="lang-en">
                <span className="lang-flag">🇬🇧</span>
                English
              </a>

              <a href="/ar/auth/login" className="lang-btn arabic" id="lang-ar">
                <span className="lang-flag">🇸🇦</span>
                العربية
              </a>

              <a href="/fr/auth/login" className="lang-btn" id="lang-fr">
                <span className="lang-flag">🇫🇷</span>
                Français
              </a>
            </div>

            <p className="footer-text">© 2026 RIZQ · Protecting a tutor&apos;s time and income</p>
          </div>
        </div>

        {/* Inline script to set NEXT_LOCALE cookie on click */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                  const href = this.getAttribute('href');
                  const locale = href.split('/')[1]; // 'en', 'ar', or 'fr'
                  document.cookie = 'NEXT_LOCALE=' + locale + ';path=/;max-age=31536000;SameSite=Strict';
                });
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
