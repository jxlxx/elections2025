import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fira-code",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Montreal 2025 Mayoral Platforms",
  description: "Compare campaign promises for the 2025 Montreal mayoral election.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${firaCode.variable} antialiased min-h-screen overflow-y-scroll`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
