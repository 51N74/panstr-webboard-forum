import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Footer from "./components/Footer.js";
import Header from "./components/Header.js";
import { NostrAuthProvider } from "./context/NostrAuthContext";
import { NostrProvider } from "./context/NostrContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Panstr - Decentralized Nostr Forum",
  description: "A fully decentralized forum platform built with Nostr protocol",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NostrAuthProvider>
          <NostrProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </NostrProvider>
        </NostrAuthProvider>
      </body>
    </html>
  );
}
