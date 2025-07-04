import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layouts/theme-provider";
import { Toaster } from "ui/sonner";
import { BASE_THEMES } from "lib/const";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Acceleronix Debra",
  description:
    "Acceleronix Debra is an intelligent AI assistant platform powered by advanced tools and integrations.",
};

const themes = BASE_THEMES.flatMap((t) => [t, `${t}-dark`]);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="default-dark"
          themes={themes}
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <div id="root">
              {children}
              <Toaster richColors />
            </div>
          </NextIntlClientProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
