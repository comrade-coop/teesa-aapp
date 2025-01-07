import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game | Teesa app",
  description: "AI powered word guessing game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {children}
    </div>
  );
}
