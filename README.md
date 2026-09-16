# Panstr

> A client-side decentralized forum built on the Nostr protocol.

Panstr is a forum-style web application that uses **Nostr relays as its primary data layer**, without a traditional backend database.

Instead of building a conventional CRUD forum with a centralized API and database, Panstr handles Nostr events directly in the browser, reconstructing posts and threaded discussions from decentralized event streams.

The project explores what a traditional discussion-board experience can look like on top of a decentralized protocol.

## Highlights

* **Decentralized data architecture** — Nostr relays act as the primary data layer
* **Traditional forum structure** — discussions are organized into Rooms rather than an algorithmic social feed
* **Nested discussions** — NIP-10 reply relationships are reconstructed into hierarchical threads
* **Client-side data layer** — IndexedDB/Dexie caches Nostr events locally for faster access and local queries
* **Nostr authentication** — supports browser-based Nostr extensions and Nostr private-key authentication
* **Relay management** — monitor and manage Nostr relays from the client
* **Nostr protocol integration** — works directly with Nostr events, tags, relay subscriptions, and protocol-specific event structures

## Why I Built It

Most forum applications follow a familiar architecture:

```text
Browser
   ↓
Backend API
   ↓
Database
```

Panstr experiments with a different model:

```text
Browser
   ↓
Nostr Relays
   ↓
Nostr Events

        ↕
   IndexedDB / Dexie
   (local cache & queries)
```

This changes where application logic lives.

Instead of relying on a central database to provide structured posts and relationships, the client has to retrieve Nostr events, interpret their tags, reconstruct relationships, maintain local state, and turn those events into a usable forum interface.

That became the main engineering challenge of the project.

## Architecture

Panstr is primarily a **client-side application**.

There is no traditional application database or central API responsible for storing forum content.

### Data layer

Nostr relays provide the primary persistence layer for forum events.

The application communicates with relays directly through `nostr-tools` and manages subscriptions, event publishing, and event retrieval in the browser.

### Local storage

Panstr uses **Dexie.js / IndexedDB** as a local cache.

This allows the application to:

* cache retrieved Nostr events
* query previously loaded data locally
* reduce repeated relay requests
* support local search and filtering
* maintain client-side application state

IndexedDB is a local client-side data layer, not a replacement for the Nostr relay network.

### Event → Forum Model

Nostr provides an event-oriented data model rather than a traditional relational forum schema.

Panstr therefore has to transform events such as:

```text
Nostr Events
     ↓
Tag / relationship parsing
     ↓
Post & reply relationships
     ↓
Thread hierarchy
     ↓
Forum UI
```

This is particularly important for threaded discussions, where reply relationships need to be reconstructed from Nostr event metadata.

## Core Features

### Forum Rooms

Panstr organizes discussions into predefined Rooms using Nostr event tags.

This provides a more traditional discussion-board experience instead of relying on an algorithmic social feed.

### Threaded Discussions

Replies are reconstructed using NIP-10 reply relationships.

The client builds nested discussion structures from otherwise flat Nostr events and renders them as a hierarchical thread.

### Nostr Authentication

Authentication supports:

* NIP-07 browser extensions
* Nostr private-key authentication

The application uses Nostr identities and signatures rather than a conventional username/password backend.

### Relay Management

Panstr includes client-side relay management functionality for:

* configuring relays
* checking relay connectivity
* monitoring relay health
* managing relay-related settings

### Local Search

Panstr maintains a local event cache and performs client-side search over cached data.

The current implementation should be understood as **local search over retrieved events**, rather than a global search index across the entire Nostr network.

## Technology

### Frontend

* Next.js
* React
* JavaScript
* Tailwind CSS
* DaisyUI

### Nostr

* `nostr-tools`
* Nostr relay subscriptions
* Nostr event publishing
* NIP-07 authentication
* NIP-10 threading
* NIP-19 identifiers
* NIP-65 relay management

### Client Data

* Dexie.js
* IndexedDB
* Fuse.js

## Project Structure

The application is organized around the client application, Nostr integration, and UI components.

```text
app/
├── components/       # UI components
├── lib/
│   ├── storage/      # IndexedDB / Dexie storage
│   └── ...           # Nostr and application logic
├── room/             # Forum room and thread views
├── wiki/             # Wiki-related functionality
└── ...

```

A significant part of the Nostr integration is centralized in the application's Nostr client layer, which handles relay communication, event processing, and protocol-specific operations.

## Engineering Challenges

### 1. Reconstructing Threads from Events

Traditional forums store relationships directly in a database.

Nostr provides a stream of events with relationships expressed through tags.

Panstr therefore reconstructs:

```text
Root Post
├── Reply
│   ├── Nested Reply
│   └── Nested Reply
└── Reply
```

from Nostr event metadata and renders that structure as a conventional forum thread.

### 2. Client-Side Persistence

Without a traditional backend database, the browser becomes responsible for managing a significant amount of application state.

Dexie/IndexedDB is used to cache events locally and provide a queryable client-side data layer.

### 3. Working with Relays

The application has to deal with decentralized relay infrastructure rather than a single authoritative API.

That introduces practical concerns around:

* relay availability
* synchronization
* event propagation
* duplicate events
* query scope
* local caching
* relay-specific capabilities

These constraints are part of the reason the application includes relay management and local caching.

## Limitations

Panstr is an experimental/portfolio project rather than a production-scale decentralized forum.

Some protocol implementations and UI areas are exploratory or partially integrated.

In particular:

* Search currently operates primarily over locally cached/retrieved events rather than providing global Nostr-wide search.
* NIP-72 community functionality is present in the codebase but is not the primary data flow for the main forum Rooms.
* Moderation functionality is not currently wired into the main forum flow.
* Notification infrastructure is incomplete.
* The application relies heavily on client-side processing and browser storage.

These limitations are intentional parts of the current project state and help define the areas that would need further work for a production system.

## Running Locally

### Requirements

* Node.js
* npm

### Install

```bash
git clone https://github.com/51N74/panstr-webboard-forum.git
cd panstr-webboard-forum
npm install
```

### Run

```bash
npm run dev
```

Then open the local development server in your browser.

## Project Status

Panstr is a **working technical project exploring decentralized forum architecture on Nostr**.

The core forum experience — browsing Rooms, reading posts, and reconstructing threaded discussions — is implemented.

The project also contains several experimental Nostr protocol integrations that are not all part of the main forum flow.

## What I Learned

Building Panstr required thinking about application architecture beyond the conventional:

> frontend → API → database

Instead, the project required working with:

> frontend → decentralized event network → local client data layer

The most interesting part was not simply connecting a React application to Nostr, but adapting a decentralized event model into a familiar forum experience with rooms, posts, replies, and nested discussions.
