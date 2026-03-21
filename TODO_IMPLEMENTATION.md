# Panstr Webboard Implementation TODO List

## Phase 1: Security & Identity 🛡️
- [x] **Task 1.1: Upgrade NIP-49 Encryption**
    - Replace current XOR placeholder with industry-standard PBKDF2 key derivation and AES-GCM encryption for stored private keys.
- [x] **Task 1.2: Refine NIP-07 Integration**
    - Ensure seamless "Connect with Extension" workflow and handle edge cases (e.g., extension locked).
- [x] **Task 1.3: Visual NIP-05 Verification**
    - Add clear "Verified User" indicators across the UI (ThreadCard, Profile, ThreadDetail).

## Phase 2: Content & Interoperability 🔄
- [x] **Task 2.1: HTML to Markdown Pipeline (NIP-23)**
    - Implement a robust converter to ensure posts published via RichTextEditor are saved as Markdown in Nostr events.
- [x] **Task 2.2: NIP-19 Identifier Support**
    - Transition from Hex strings to `nevent`, `nprofile`, and `naddr` in routing and sharing features.
- [x] **Task 2.3: NIP-94/96 Media Standardization**
    - Align file uploads with official Nostr media upload standards for cross-client image availability.

## Phase 3: Social Features & Privacy 👥
- [x] **Task 3.1: Mute & Bookmarks (NIP-51)**
    - Allow users to mute specific pubkeys/events and bookmark favorite threads (Kind 10000/10003).
- [x] **Task 3.2: Community Refinement (NIP-72)**
    - Enhance moderated community features including rule definitions and moderator actions.

## Phase 4: Monetization & Discovery ⚡
- [x] **Task 4.1: Advanced Zaps (NIP-57)**
    - Implement automated Lightning Address discovery and improved Zap receipt visualization.
- [x] **Task 4.2: App Handler Declaration (NIP-89)**
    - Create and publish NIP-89 events to make Panstr discoverable as a forum/webboard handler.

---
*Created on: 2026-03-21* (Updated: All Tasks Complete)
