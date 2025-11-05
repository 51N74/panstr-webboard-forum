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
    <html data-theme="nord" lang="en">
      <body className={inter.className}>
        <NostrAuthProvider>
          <NostrProvider>
            <div className="min-h-screen bg-base-200">
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
