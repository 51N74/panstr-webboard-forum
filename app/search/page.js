"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SearchComponent from "../components/search/SearchComponent";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNostrAuth } from "../context/NostrAuthContext";
import searchManager from "../lib/search/searchManager";

export default function SearchPage() {
  const { user } = useNostrAuth();
  const searchParams = useSearchParams();
  const [initialQuery, setInitialQuery] = useState(
    searchParams?.get("q") || "",
  );
  const [searchResults, setSearchResults] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    if (initialQuery) {
      // Auto-search if query is in URL
      handleSearch(initialQuery);
    }

    // Load search history if user is logged in
    if (user) {
      loadSearchHistory();
    }
  }, [initialQuery, user]);

  const loadSearchHistory = async () => {
    try {
      const history = await searchManager.getRecentSearches(user.pubkey);
      setSearchHistory(history);
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const handleSearch = async (query, results) => {
    setSearchResults(results);

    // Update URL without page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location);
      if (query) {
        url.searchParams.set("q", query);
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState({}, "", url);
    }
  };

  const getPopularSearches = () => [
    "nostr protocol",
    "decentralized social",
    "bitcoin integration",
    "web3 forum",
    "privacy tools",
  ];

  const getTrendingTopics = () => [
    { tag: "nostr", count: 1234 },
    { tag: "bitcoin", count: 892 },
    { tag: "lightning", count: 567 },
    { tag: "decentralization", count: 445 },
    { tag: "privacy", count: 378 },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-base-content mb-4">
            Search Forum
          </h1>
          <p className="text-lg text-base-content/70 mb-6">
            Find threads, users, and content across the Panstr forum
          </p>
        </div>

        {/* Search Component */}
        <div className="mb-8">
          <SearchComponent
            compact={false}
            placeholder="Search for threads, users, or topics..."
            onSearch={handleSearch}
          />
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="mb-8">
            <div className="bg-base-100 rounded-lg border border-base-300 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-base-content">
                  Search Results
                </h2>
                {searchResults.pagination && (
                  <div className="text-sm text-base-content/60">
                    Found {searchResults.pagination.total.toLocaleString()}{" "}
                    result{searchResults.pagination.total !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {searchResults.error && (
                <div className="alert alert-error">
                  <svg
                    className="w-6 h-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Search failed: {searchResults.error}</span>
                </div>
              )}

              {searchResults.results && searchResults.results.length > 0 && (
                <div className="space-y-4">
                  {searchResults.results.map((result, index) => (
                    <div
                      key={`${result.resultType}-${result.id || result.pubkey}-${index}`}
                      className="bg-base-100 rounded-lg border border-base-300 p-4 hover:border-primary transition-colors"
                    >
                      {result.resultType === "thread" ? (
                        <ThreadSearchResult result={result} />
                      ) : (
                        <UserSearchResult result={result} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchResults.results && searchResults.results.length === 0 && (
                <div className="text-center py-8 text-base-content/50">
                  <div className="text-6xl mb-4 opacity-50">🔍</div>
                  <p className="text-lg mb-2">No results found</p>
                  <p className="text-sm">
                    Try adjusting your search terms or browse the forums
                  </p>
                </div>
              )}

              {/* Load More Button */}
              {searchResults.pagination?.hasMore && (
                <div className="text-center mt-6">
                  <button className="btn btn-outline">Load More Results</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Search Yet - Show Helpful Content */}
        {!searchResults && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Popular Searches */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                <h3 className="text-lg font-semibold text-base-content mb-4">
                  Popular Searches
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getPopularSearches().map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInitialQuery(search);
                        handleSearch(search);
                      }}
                      className="text-left p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 text-base-content/40"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        <span className="text-sm text-base-content">
                          {search}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Tips */}
              <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                <h3 className="text-lg font-semibold text-base-content mb-4">
                  Search Tips
                </h3>
                <ul className="space-y-3 text-sm text-base-content/80">
                  <li className="flex items-start space-x-2">
                    <svg
                      className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Use specific keywords to find relevant content faster
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg
                      className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Filter by date range, room, or author for more targeted
                      results
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg
                      className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Search for users by their name or display name</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <svg
                      className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Try advanced search to combine multiple filters</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="space-y-6">
              <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                <h3 className="text-lg font-semibold text-base-content mb-4">
                  Trending Topics
                </h3>
                <div className="space-y-3">
                  {getTrendingTopics().map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInitialQuery(topic.tag);
                        handleSearch(topic.tag);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">#</span>
                        <span className="text-sm font-medium text-base-content">
                          {topic.tag}
                        </span>
                      </div>
                      <span className="text-xs text-base-content/60 bg-base-200 px-2 py-1 rounded-full">
                        {topic.count.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                <h3 className="text-lg font-semibold text-base-content mb-4">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <a
                    href="/"
                    className="block text-sm text-primary hover:underline"
                  >
                    ← Back to Forums
                  </a>
                  {user && (
                    <a
                      href="/bookmarks"
                      className="block text-sm text-primary hover:underline"
                    >
                      📖 My Bookmarks
                    </a>
                  )}
                  <a
                    href="/rooms"
                    className="block text-sm text-primary hover:underline"
                  >
                    🏠 Browse Rooms
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// Helper components for search results
function ThreadSearchResult({ result }) {
  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-base-content hover:text-primary transition-colors">
          <a href={`/room/${result.room?.id || "general"}/thread/${result.id}`}>
            {result.title || "Untitled Thread"}
          </a>
        </h4>
        <span className="text-xs text-base-content/50">
          {result.kind === 30023 ? "Thread" : "Reply"}
        </span>
      </div>

      <div className="text-sm text-base-content/70 mb-2">
        {result.highlightedSnippets && result.highlightedSnippets.length > 0 ? (
          <div className="space-y-1">
            {result.highlightedSnippets.map((snippet, idx) => (
              <div key={idx} dangerouslySetInnerHTML={{ __html: snippet }} />
            ))}
          </div>
        ) : (
          result.contentPreview
        )}
      </div>

      <div className="flex items-center space-x-4 text-xs text-base-content/50">
        <div className="flex items-center space-x-1">
          <img
            src={
              result.authorPicture ||
              `https://robohash.org/${result.author}.png`
            }
            alt={result.authorName}
            className="w-4 h-4 rounded-full"
          />
          <span>{result.authorName}</span>
        </div>
        <span>•</span>
        <span>{new Date(result.created_at * 1000).toLocaleDateString()}</span>
        {result.room && (
          <>
            <span>•</span>
            <span>{result.room.name}</span>
          </>
        )}
      </div>
    </div>
  );
}

function UserSearchResult({ result }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="avatar">
        <div className="w-12 h-12 rounded-full">
          {result.picture ? (
            <img
              src={result.picture}
              alt={result.name}
              className="object-cover"
            />
          ) : (
            <div className="bg-neutral text-neutral-content flex items-center justify-center h-full">
              {result.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h4 className="font-semibold text-base-content hover:text-primary transition-colors">
          <a href={`/profile/${result.pubkey}`}>{result.name}</a>
        </h4>

        {result.display_name && result.display_name !== result.name && (
          <p className="text-sm text-base-content/70">{result.display_name}</p>
        )}

        {result.about && (
          <p className="text-sm text-base-content/60 mt-1">
            {result.about.substring(0, 100)}
            {result.about.length > 100 && "..."}
          </p>
        )}

        <div className="flex items-center space-x-3 mt-2 text-xs text-base-content/50">
          {result.nip05 && (
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Verified</span>
            </div>
          )}
          <span>
            Joined {new Date(result.created_at * 1000).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
