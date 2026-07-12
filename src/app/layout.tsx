import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { apercuVariable } from "@/fonts/apercu.generated";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Haya Plus | منصة صناعة المحتوى",
  description: "منصة داخلية لفريق التسويق لصياغة تغريدات مطابقة لأسلوب anb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${apercuVariable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
