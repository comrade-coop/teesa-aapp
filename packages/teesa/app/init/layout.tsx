import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Init | Teesa app"
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
