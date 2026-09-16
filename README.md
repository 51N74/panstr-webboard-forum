# Panstr

> A forum-style discussion platform built without a traditional backend database.

Panstr is a web-based discussion platform that explores a different approach to building a forum.

Instead of the conventional:

```text
Browser → API → Database
```

Panstr uses a **decentralized event network as its primary data layer**, with the application handling event processing, thread reconstruction, local caching, and search on the client.

The underlying protocol is **Nostr**.

## Why I Built It

Traditional forums rely on a central database to store posts, users, replies, and relationships.

I wanted to explore what happens when that database is replaced by an event-based network.

This introduced a different set of engineering problems:

* How do you retrieve and organize distributed events?
* How do you reconstruct threaded discussions from event relationships?
* How do you maintain useful local state without a backend?
* How do you deal with multiple data sources and relay availability?
* How do you turn an event-oriented data model into a familiar forum experience?

Panstr is my exploration of those problems.

## Architecture

```text
                    ┌─────────────────┐
                    │   Panstr Web UI │
                    │   Next.js/React │
                    └────────┬────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
        ┌─────────────────┐    ┌─────────────────┐
        │  Event Network  │    │  Local Storage  │
        │  Nostr Relays   │    │ IndexedDB/Dexie │
        └─────────────────┘    └─────────────────┘
                 │                       │
                 └───────────┬───────────┘
                             ▼
                    ┌─────────────────┐
                    │ Event Processing│
                    │ & Thread Model  │
                    └─────────────────┘
```

### No Traditional Backend

Panstr does not use a conventional application backend or central database for forum content.

The browser communicates directly with Nostr relays using `nostr-tools`.

Forum data is represented as events rather than database records.

### Local Data Layer

Panstr uses **IndexedDB through Dexie.js** to cache events locally.

The local data layer is used for:

* caching retrieved events
* local queries
* reducing repeated relay requests
* client-side search
* maintaining application state

This means the application has to manage more of the data-processing workload in the browser than a conventional API-driven application.

## Core Features

### Forum Rooms

Discussions are organized into predefined **Rooms** using Nostr event tags.

The interface is intentionally closer to a traditional discussion board than an algorithmic social-media feed.

Users browse discussions by topic rather than relying on a personalized ranking system.

### Threaded Discussions

One of the main technical challenges is converting Nostr's event-based reply relationships into a conventional forum thread.

Panstr processes NIP-10 reply metadata to reconstruct structures such as:

```text
Original Post
├── Reply
│   ├── Nested Reply
│   └── Nested Reply
└── Reply
    └── Nested Reply
```

The underlying data is a collection of events; the application builds the hierarchical discussion model at runtime.

### Nostr Identity

Users can authenticate through:

* NIP-07 browser extensions
* Nostr private-key authentication

The application works with public-key identities and signed events rather than a traditional username/password authentication system.

### Relay Management

Panstr includes client-side relay management for:

* configuring relays
* checking relay connectivity
* monitoring relay health
* managing relay-related settings

### Local Search

Retrieved events can be cached locally and searched through the browser.

The current implementation primarily searches the application's locally available dataset rather than providing a global search index across the entire network.

## Technology

### Application

* Next.js
* React
* JavaScript
* Tailwind CSS
* DaisyUI

### Data & Protocol

* Nostr
* `nostr-tools`
* Nostr relays
* IndexedDB
* Dexie.js
* Fuse.js

### Protocol Integrations

The codebase includes implementations and experiments around several Nostr specifications, including:

* NIP-07 — Browser Extension Signing
* NIP-10 — Threaded Replies
* NIP-11 — Relay Information
* NIP-19 — Encoded Identifiers
* NIP-50 — Search
* NIP-54 — Wiki
* NIP-57 — Zaps
* NIP-65 — Relay List Metadata
* NIP-72 — Communities
* NIP-86 — Relay Management
* NIP-89 — Application Discovery
* NIP-90 — Data Vending
* NIP-96 — File Storage

Some of these integrations are experimental or partially connected to the main forum experience.

## Engineering Challenges

### Distributed Data Instead of a Database

In a conventional forum, the database provides a single source of truth.

Panstr instead retrieves events from external relays.

This means the application has to account for:

* multiple relays
* event duplication
* relay availability
* event propagation
* query scope
* local caching
* inconsistent availability of data

### Reconstructing Relationships

A relational database can represent:

```text
posts
replies
users
parent_id
```

directly.

Nostr represents relationships through event metadata and tags.

Panstr therefore has to interpret those relationships and reconstruct a usable forum hierarchy in the client.

### Client-Side State

Without a traditional backend handling application state, more responsibility moves into the browser.

Panstr uses IndexedDB/Dexie to maintain a local event cache and performs part of its querying and search locally.

This architecture reduces dependence on a centralized backend but introduces different constraints around browser storage, synchronization, and dataset size.

## Project Structure

```text
app/
├── components/        # UI components
├── lib/
│   ├── storage/       # IndexedDB / Dexie
│   └── ...            # Nostr and application logic
├── room/              # Forum rooms and threads
├── wiki/              # Wiki functionality
└── ...
```

The main Nostr integration is handled through the application's client layer, which manages relay communication, event processing, publishing, subscriptions, and protocol-specific functionality.

## Current Limitations

Panstr is an experimental portfolio project rather than a production-scale forum.

Known limitations include:

* Local search operates on events available to the client rather than a global search index.
* The main forum Rooms use their own event/tag structure rather than relying entirely on NIP-72 Communities.
* Some community and moderation functionality exists at the protocol/code level but is not fully connected to the main forum flow.
* Notification infrastructure is incomplete.
* Client-side processing and browser storage limit how much data can be handled efficiently.
* Private-key authentication requires careful handling because sensitive keys are processed in the browser.

These limitations are part of the current state of the project.

## Running Locally

### Requirements

* Node.js
* npm

### Installation

```bash
git clone https://github.com/51N74/panstr-webboard-forum.git
cd panstr-webboard-forum
npm install
```

### Development

```bash
npm run dev
```

Open the development server in your browser.

## Project Status

Panstr is a working exploration of **building a forum around an event-based, decentralized data model instead of a conventional backend database**.

The main forum experience includes:

* browsing Rooms
* reading posts
* creating posts
* viewing nested discussions
* working with Nostr identities
* connecting to and managing relays

The repository also contains additional protocol integrations and experiments that are not all part of the core forum flow.

## What This Project Demonstrates

Panstr gave me practical experience with a different class of application architecture:

```text
Traditional Application

Frontend → API → Database


Panstr

Frontend → Event Network
             ↕
        Local Data Layer
```

The most valuable part of the project was learning how to turn a decentralized, event-oriented data model into a familiar application experience.

Rather than simply consuming an API, the client is responsible for interpreting events, reconstructing relationships, managing local data, and coordinating with external relays.

That architecture became the core engineering challenge behind Panstr.
