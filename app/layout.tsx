import type { Metadata } from "next";
import { Geist, Geist_Mono, Pixelify_Sans } from "next/font/google";
import "./globals.css";
import "./pixel.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header"; // Assuming this is where you create it
import { getCurrentUser } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ticketing App",
  description: "Microservices Ticketing",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const currentUser = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pixel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Pass the fetched data down as a prop */}
        <Header currentUser={currentUser} />

        {/* Wrap children in a main tag to take up remaining height */}
        <div className="flex-1">{children}</div>

        <Toaster />
      </body>
    </html>
  );
}
