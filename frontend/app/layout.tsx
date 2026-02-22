import type { Metadata } from "next";
import { Bebas_Neue, Rajdhani } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from '@/app/contexts/AuthContext';

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["300", "400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: "400",
});

export const metadata: Metadata = {
  title: "Yello Premier League Auction",
  description: "Join the Ultimate Cricket Auction Experience - Build Your Dream Team!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${rajdhani.variable} ${bebasNeue.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster richColors closeButton position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
