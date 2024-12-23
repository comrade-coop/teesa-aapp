import type { Metadata } from "next";
import PrivyIoProvider from "./privy-provider";

export const metadata: Metadata = {
  title: "Teesa app",
  description: "AI powered word guessing game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PrivyIoProvider>
      <div className="fixed inset-0 overflow-hidden">
        {children}
      </div>
    </PrivyIoProvider>
  );
}
