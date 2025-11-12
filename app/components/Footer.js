"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-5xl animate-pulse">🌏</span>
              <div>
                <h2 className="text-3xl font-bold gradient-text">
                  Panstr Forum
                </h2>
                <p className="text-gray-300 mt-1">
                  Decentralized discussions on Nostr
                </p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6 max-w-lg">
              A privacy-focused, censorship-resistant forum powered by the Nostr
              protocol. Join the decentralized web and own your conversations.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <a
                href="https://twitter.com/nostrprotocol"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all duration-300 group"
                title="Follow on Twitter"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  className="fill-current group-hover:scale-110 transition-transform"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/nostr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:scale-110 transition-all duration-300 group"
                title="Join Discord"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  className="fill-current group-hover:scale-110 transition-transform"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href="https://github.com/panstr/webboard-forum"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-600 hover:scale-110 transition-all duration-300 group"
                title="View on GitHub"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  className="fill-current group-hover:scale-110 transition-transform"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">
              Navigation
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    🏠
                  </span>
                  <span>Forums</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    🔍
                  </span>
                  <span>Search</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/rooms"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    🏛️
                  </span>
                  <span>Browse Rooms</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/bookmarks"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    🔖
                  </span>
                  <span>Bookmarks</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-400">
              Community
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/nostr-protocol/nips"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    📋
                  </span>
                  <span>NIPs</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/nostr-protocol/nostr-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    🛠️
                  </span>
                  <span>Nostr Tools</span>
                </a>
              </li>
              <li>
                <a
                  href="https://nostr.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    🌐
                  </span>
                  <span>About Nostr</span>
                </a>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    💡
                  </span>
                  <span>Help & Support</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">
              Developers
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/nostr-protocol/nostr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    📖
                  </span>
                  <span>Protocol Docs</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/panstr/webboard-forum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    💻
                  </span>
                  <span>GitHub Repo</span>
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/nostr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    💬
                  </span>
                  <span>Developer Discord</span>
                </a>
              </li>
              <li>
                <Link
                  href="/api"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    🔌
                  </span>
                  <span>API Reference</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                &copy; {currentYear} Panstr Forum. All rights reserved.
              </p>
              <div className="flex items-center justify-center md:justify-start space-x-6 mt-2">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Terms
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-gray-400">
              <span>Built with</span>
              <span className="text-red-500 animate-pulse">❤️</span>
              <span>for the</span>
              <a
                href="https://nostr.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
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
