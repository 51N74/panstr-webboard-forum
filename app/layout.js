"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import NostrLoginModal from "./components/NostrLoginModal.js";
import { NostrAuthProvider, useNostrAuth } from "./context/NostrAuthContext";
import { NostrProvider } from "./context/NostrContext";
import { NostrListsProvider } from "./context/NostrListsContext";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

function AppContent({ children }) {
  const { isLoginModalOpen, setShowLoginModal } = useNostrAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* 
        Standardized Layout Padding 
        Using pt-20 to ensure content is never hidden behind the fixed Navbar (h-14)
      */}
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
      
      {/* 
        Root-level Modal Rendering
        Escapes parent CSS constraints for perfect centering and layering
      */}
      {isLoginModalOpen && (
        <NostrLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased text-primary bg-background selection:bg-accent/10 selection:text-accent">
        <NostrAuthProvider>
          <NostrProvider>
            <NostrListsProvider>
              <AppContent>{children}</AppContent>
            </NostrListsProvider>
          </NostrProvider>
        </NostrAuthProvider>
      </body>
    </html>
  );
}
