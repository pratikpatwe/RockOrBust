import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RockOrBust | Decentralized Residential Proxy Network",
    template: "%s | RockOrBust"
  },
  description: "RockOrBust is an industrial-grade, open-source residential proxy infrastructure designed to help automated browsers bypass advanced anti-bot systems with ease.",
  keywords: [
    "residential proxy",
    "proxy network",
    "browser automation",
    "Playwright stealth",
    "Puppeteer stealth",
    "anti-bot bypass",
    "open-source proxy",
    "web scraping",
    "RockOrBust",
    "headless browser"
  ],
  authors: [{ name: "BuildShot", url: "https://buildshot.xyz" }],
  creator: "BuildShot",
  publisher: "BuildShot",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rockorbust.com",
    siteName: "RockOrBust",
    title: "RockOrBust | Decentralized Residential Proxy Network",
    description: "Industrial-grade, open-source stealth proxy infrastructure. Bypass advanced anti-bot systems seamlessly using native Playwright and Puppeteer plugins.",
    images: [
      {
        url: "https://raw.githubusercontent.com/pratikpatwe/RockOrBust/main/apps/web/public/og-image.png",
        width: 1200,
        height: 630,
        alt: "RockOrBust Architecture and Network",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RockOrBust | Decentralized Residential Proxy Network",
    description: "Industrial-grade, open-source stealth proxy infrastructure for Playwright and Puppeteer.",
    creator: "@pratikpatwe",
    images: ["https://raw.githubusercontent.com/pratikpatwe/RockOrBust/main/apps/web/public/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-black text-white selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
