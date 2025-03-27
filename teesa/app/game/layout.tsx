import type { Metadata } from "next";
import { VideoBackground } from "./_components/video-background";

export const metadata: Metadata = {
  title: "Teesa",
  description: "AI powered word guessing game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <VideoBackground />
      {children}
    </div>
  );
}
