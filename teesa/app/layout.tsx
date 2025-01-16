import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PrivyIoProvider from "./privy-provider";
import { setupContractEventListeners } from "./game/_actions/contract-events";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teesa aapp",
  description: "AI powered word guessing game",
};

// Initialize contract event listeners
setupContractEventListeners().catch(error => {
  console.error('Failed to setup contract event listeners:', error);
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyIoProvider>
          {children}
        </PrivyIoProvider>
      </body>
    </html>
  );
}
