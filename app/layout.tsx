import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const neueHaasGrotesk = localFont({
  src: [
    { path: "./fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayLight.ttf", weight: "300", style: "normal" },
    { path: "./fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayLightItalic.ttf", weight: "300", style: "italic" },
    { path: "./fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayRoman.ttf", weight: "400", style: "normal" },
    { path: "./fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayRomanItalic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayMediu.ttf", weight: "500", style: "normal" },
    { path: "./fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayMediumItalic.ttf", weight: "500", style: "italic" },
    { path: "./fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayBold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayBoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Reservoir",
  description: "A collection of cultural debris accumulated over time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${neueHaasGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
