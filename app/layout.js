import { Inter } from "next/font/google";
import { Manrope } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Footer from "./components/Footer.js";
import Header from "./components/Header.js";
import { NostrAuthProvider } from "./context/NostrAuthContext";
import { NostrProvider } from "./context/NostrContext";
import { NostrListsProvider } from "./context/NostrListsContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata = {
  title: "Panstr - Decentralized Nostr Forum",
  description: "A fully decentralized forum platform built with Nostr protocol",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} ${manrope.variable} bg-surface text-on-surface`}>
        <NostrAuthProvider>
          <NostrProvider>
            <NostrListsProvider>
              <div className="min-h-screen bg-surface">
                <Header />
                <main className="flex-1 pt-16">{children}</main>
                <Footer />
              </div>
            </NostrListsProvider>
          </NostrProvider>
        </NostrAuthProvider>
      </body>
    </html>
  );
}
