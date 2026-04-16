"use client";

import Link from "next/link";

/**
 * Footer Component - Panstr Minimal
 * Clean, informational, and unobtrusive
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-muted border-t border-surface-border mt-20">
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center text-[8px] text-surface font-black">P</div>
              <span className="text-sm font-bold tracking-tighter text-primary">Panstr</span>
            </div>
            <p className="text-xs text-secondary leading-relaxed max-w-sm">
              Censorship-resistant forum protocol built on Nostr. 
              Own your data, your identity, and your community.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-xs text-secondary hover:text-primary transition-colors">Forums</Link></li>
              <li><Link href="/discovery" className="text-xs text-secondary hover:text-primary transition-colors">Discovery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="https://nostr.com" target="_blank" className="text-xs text-secondary hover:text-primary transition-colors">About Nostr</a></li>
              <li><a href="https://github.com/panstr" target="_blank" className="text-xs text-secondary hover:text-primary transition-colors">GitHub</a></li>
              <li><Link href="/help" className="text-xs text-secondary hover:text-primary transition-colors">Help</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-surface-border/50 gap-4">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">
            &copy; {currentYear} Panstr — Powered by Nostr
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-[10px] font-bold text-secondary uppercase tracking-tighter hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="text-[10px] font-bold text-secondary uppercase tracking-tighter hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
