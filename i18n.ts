import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'ar', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ['ar'];

export default getRequestConfig(async ({ requestLocale }) => {
  // Await the locale from the request
  const locale = await requestLocale;

  // Validate that the incoming locale is supported
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // Zero-mixing rule: throw on missing translations — no fallback permitted
    onError(error) {
      if (error.code === 'MISSING_MESSAGE') {
        console.error(
          `[RIZQ i18n VIOLATION] Missing translation for locale "${locale}": ${error.message}`
        );
        // In production, this will surface as a build warning
        // In development, it throws to alert developers immediately
        if (process.env.NODE_ENV === 'development') {
          throw error;
        }
      }
    },
    getMessageFallback({ namespace, key }) {
      // Return a visible marker instead of falling back to English
      return `⚠️ [${locale}:${namespace}.${key}]`;
    },
  };
});
