"use client";

import { useNostrAuth } from "./context/NostrAuthContext";
import { NostrProvider } from "./context/NostrContext";
import BoardList from "./boards/BoardList";
import Header from "./components/Header";

export default function HomePage() {
  return (
    <NostrProvider>
      <div className="min-h-screen bg-base-200">
        <Header />
        <main>
          <BoardList />
        </main>
      </div>
    </NostrProvider>
  );
}
