"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/20">
      <div className="container mx-auto px-4 py-12 max-w-screen-2xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🌏</span>
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tighter">
                  Panstr
                </h2>
                <p className="text-xs text-secondary font-medium">Decentralized Discussions</p>
              </div>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
              A privacy-focused, censorship-resistant forum powered by the Nostr
              protocol. Join the decentralized web and own your conversations.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/nostrprotocol"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center hover:bg-secondary-container hover:text-secondary transition-all duration-300 group"
                title="Follow on Twitter"
              >
                <span className="material-symbols-outlined text-base">g_mobiledata</span>
              </a>
              <a
                href="https://discord.gg/nostr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center hover:bg-secondary-container hover:text-secondary transition-all duration-300 group"
                title="Join Discord"
              >
                <span className="material-symbols-outlined text-base">chat</span>
              </a>
              <a
                href="https://github.com/panstr/webboard-forum"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center hover:bg-secondary-container hover:text-secondary transition-all duration-300 group"
                title="View on GitHub"
              >
                <span className="material-symbols-outlined text-base">code</span>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-primary mb-4 font-['Manrope']">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">home</span>
                  Forums
                </Link>
              </li>
              <li>
                <Link
                  href="/discovery"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">explore</span>
                  Discover
                </Link>
              </li>
              <li>
                <Link
                  href="/communities"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">groups</span>
                  Communities
                </Link>
              </li>
              <li>
                <Link
                  href="/bookmarks"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">bookmark</span>
                  Bookmarks
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-bold text-primary mb-4 font-['Manrope']">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/nostr-protocol/nips"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">description</span>
                  NIPs
                </a>
              </li>
              <li>
                <a
                  href="https://nostr.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">language</span>
                  About Nostr
                </a>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">help</span>
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="font-bold text-primary mb-4 font-['Manrope']">Developers</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/nostr-protocol/nostr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">api</span>
                  Protocol Docs
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/panstr/webboard-forum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-primary transition-colors duration-200 flex items-center gap-2 text-sm font-medium group"
                >
                  <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">code</span>
                  GitHub Repo
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-outline-variant/15 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-secondary text-xs">
                &copy; {currentYear} Panstr Forum. All rights reserved.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                <Link
                  href="/privacy"
                  className="text-secondary hover:text-primary transition-colors text-xs font-medium"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-secondary hover:text-primary transition-colors text-xs font-medium"
                >
                  Terms
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 text-secondary text-xs">
              <span>Built with</span>
              <span className="material-symbols-filled text-error text-sm">favorite</span>
              <span>for the</span>
              <a
                href="https://nostr.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tertiary hover:text-primary transition-colors font-bold"
              >
                Nostr community
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
