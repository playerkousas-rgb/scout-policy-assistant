import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "童軍政策助理 | Scout Policy Assistant",
  description: "香港童軍總會政策及指引問答助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}