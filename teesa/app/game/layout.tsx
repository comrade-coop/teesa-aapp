import type { Metadata } from "next";
import PrivyIoProvider from "./privy-provider";

export const metadata: Metadata = {
  title: "Teesa aapp",
  description: "AI powered word guessing game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PrivyIoProvider>
      <div className="absolute w-full top-0 bottom-0 px-4 md:px-0">
        {children}
      </div>
    </PrivyIoProvider>
  );
}
