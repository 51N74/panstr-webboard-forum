"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import searchManager from "../../lib/search/searchManager";
import db from "../../lib/storage/indexedDB";

const SearchComponent = ({
  onSearch,
  compact = false,
  placeholder = "Search threads and users...",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    type: "all", // all, threads, users
    timeRange: "all", // all, today, week, month, year
    sortBy: "relevance", // relevance, recent, popular
    room: "",
    author: "",
  });

  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length >= 2) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        handleSearchSuggestions();
      }, 300);
    } else {
      setSuggestions([]);
      setResults(null);
    }

    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  const loadRecentSearches = async () => {
    try {
      const searches = await searchManager.getRecentSearches();
      setRecentSearches(searches);
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const handleSearchSuggestions = async () => {
    try {
      const suggestionResults = await searchManager.getSearchSuggestions(query);
      setSuggestions(suggestionResults);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error getting suggestions:", error);
    }
  };

  const handleSearch = async (searchQuery = query, useAdvanced = false) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      // Save to recent searches
      await searchManager.saveSearch(searchQuery);

      // Prepare search options
      let searchOptions = {
        limit: 20,
        useCache: true,
      };

      if (useAdvanced && showAdvanced) {
        searchOptions = {
          ...searchOptions,
          ...prepareAdvancedFilters(),
        };
      }

      // Perform search based on type
      let searchResults;
      const searchType = filters.type;

      if (searchType === "users") {
        searchResults = await searchManager.searchUsers(
          searchQuery,
          searchOptions,
        );
      } else if (searchType === "threads") {
        searchResults = await searchManager.searchThreads(
          searchQuery,
          searchOptions,
        );
      } else {
        // Search both
        const [threadResults, userResults] = await Promise.all([
          searchManager.searchThreads(searchQuery, {
            ...searchOptions,
            limit: 15,
          }),
          searchManager.searchUsers(searchQuery, {
            ...searchOptions,
            limit: 5,
          }),
        ]);

        searchResults = {
          results: [
            ...threadResults.results.map((r) => ({
              ...r,
              resultType: "thread",
            })),
            ...userResults.results.map((r) => ({ ...r, resultType: "user" })),
          ],
          pagination: {
            ...threadResults.pagination,
            total:
              threadResults.pagination.total + userResults.pagination.total,
          },
        };
      }

      setResults(searchResults);
      setRecentSearches(await searchManager.getRecentSearches());

      if (onSearch) {
        onSearch(searchQuery, searchResults);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults({
        results: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareAdvancedFilters = () => {
    const advancedFilters = {
      kinds: [30023, 1], // Forum threads and replies
    };

    // Time range filters
    if (filters.timeRange !== "all") {
      const now = Math.floor(Date.now() / 1000);
      let since = null;

      switch (filters.timeRange) {
        case "today":
          since = now - 24 * 60 * 60;
          break;
        case "week":
          since = now - 7 * 24 * 60 * 60;
          break;
        case "month":
          since = now - 30 * 24 * 60 * 60;
          break;
        case "year":
          since = now - 365 * 24 * 60 * 60;
          break;
      }

      if (since) {
        advancedFilters.since = since;
      }
    }

    // Room filter
    if (filters.room.trim()) {
      advancedFilters.roomId = filters.room.trim();
    }

    // Author filter
    if (filters.author.trim()) {
      advancedFilters.authors = [filters.author.trim()];
    }

    // Sort filter
    advancedFilters.sortBy = filters.sortBy;

    return advancedFilters;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleRecentSearchClick = (search) => {
    setQuery(search);
    handleSearch(search);
  };

  const clearRecentSearches = async () => {
    try {
      await db.cacheSearchResults("recent_searches_anonymous", []);
      setRecentSearches([]);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  };

  const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const renderSearchResults = () => {
    if (!results) return null;

    if (results.error) {
      return (
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
          <span>Search failed: {results.error}</span>
        </div>
      );
    }

    if (results.results.length === 0) {
      return (
        <div className="text-center py-8 text-base-content/50">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <p className="text-lg mb-2">No results found</p>
          <p className="text-sm">Try adjusting your search terms or filters</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-base-content/60">
            Found {results.pagination.total} result
            {results.pagination.total !== 1 ? "s" : ""}
          </p>
          {results.pagination.hasMore && (
            <button className="btn btn-sm btn-outline">Load more</button>
          )}
        </div>

        {results.results.map((result, index) => (
          <div
            key={`${result.resultType}-${result.id || result.pubkey}-${index}`}
            className="bg-base-100 rounded-lg border border-base-300 p-4 hover:border-primary transition-colors"
          >
            {result.resultType === "thread" ? (
              <ThreadSearchResult result={result} query={query} />
            ) : (
              <UserSearchResult result={result} query={query} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const ThreadSearchResult = ({ result, query }) => (
    <div>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-base-content hover:text-primary transition-colors">
          <Link
            href={`/room/${result.room?.id || "general"}/thread/${result.id}`}
          >
            {result.title
              ? highlightText(result.title, query)
              : "Untitled Thread"}
          </Link>
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

  const UserSearchResult = ({ result, query }) => (
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
          <Link href={`/profile/${result.pubkey}`}>
            {highlightText(result.name, query)}
          </Link>
        </h4>

        {result.display_name && result.display_name !== result.name && (
          <p className="text-sm text-base-content/70">
            {highlightText(result.display_name, query)}
          </p>
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

  if (compact) {
    return (
      <div className="relative" ref={searchRef}>
        <div className="form-control">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length >= 2 || recentSearches.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="input input-bordered w-full input-sm"
          />
          {loading && (
            <div className="absolute right-2 top-2.5">
              <div className="loading loading-spinner loading-xs"></div>
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            {query.trim().length >= 2 && suggestions.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-base-content/50 px-2 py-1">
                  Suggestions
                </p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-2 py-1.5 hover:bg-base-200 rounded text-sm"
                  >
                    {highlightText(suggestion, query)}
                  </button>
                ))}
              </div>
            )}

            {recentSearches.length > 0 && query.trim().length < 2 && (
              <div className="p-2">
                <div className="flex justify-between items-center px-2 py-1">
                  <p className="text-xs text-base-content/50">Recent</p>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-error hover:underline"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-2 py-1.5 hover:bg-base-200 rounded text-sm"
                  >
                    <svg
                      className="w-3 h-3 inline mr-2 text-base-content/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {search}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length >= 2 || recentSearches.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="modern-input w-full pl-12 pr-24 text-base"
          />
          {loading && (
            <div className="absolute inset-y-0 right-12 pr-4 flex items-center">
              <div className="loading loading-spinner loading-sm text-blue-600"></div>
            </div>
          )}
        </div>

        {/* Advanced Search Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="absolute right-4 top-3 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium px-3 py-1 rounded-lg hover:bg-gray-100"
        >
          {showAdvanced ? "← Simple" : "Advanced →"}
        </button>

        {/* Enhanced Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-3 glass-morphism rounded-2xl shadow-2xl z-50 max-h-96 overflow-hidden">
            {query.trim().length >= 2 && suggestions.length > 0 && (
              <div className="p-4 border-b border-gray-200/50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  Suggestions
                </p>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 text-sm text-gray-700 hover:text-blue-600 group"
                    >
                      <svg
                        className="w-4 h-4 inline mr-3 text-gray-400 group-hover:text-blue-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {highlightText(suggestion, query)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentSearches.length > 0 && query.trim().length < 2 && (
              <div className="p-4">
                <div className="flex justify-between items-center px-3 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Recent Searches
                  </p>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 text-sm text-gray-700 group"
                    >
                      <svg
                        className="w-4 h-4 inline mr-3 text-gray-400 group-hover:text-gray-600 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Advanced Search Filters */}
      {showAdvanced && (
        <div className="glass-card p-6 border border-gray-200/50">
          <div className="flex items-center space-x-3 mb-6">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">
              Advanced Search
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Search Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value }))
                }
                className="modern-input w-full"
              >
                <option value="all">🌐 All Results</option>
                <option value="threads">💬 Threads Only</option>
                <option value="users">👤 Users Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏰ Time Range
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, timeRange: e.target.value }))
                }
                className="modern-input w-full"
              >
                <option value="all">📅 All Time</option>
                <option value="today">🌞 Today</option>
                <option value="week">📆 This Week</option>
                <option value="month">🗓️ This Month</option>
                <option value="year">📈 This Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                }
                className="modern-input w-full"
              >
                <option value="relevance">🎯 Relevance</option>
                <option value="recent">🕐 Most Recent</option>
                <option value="popular">🔥 Most Popular</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏛️ Room Filter
              </label>
              <input
                type="text"
                placeholder="Enter room ID or name"
                value={filters.room}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, room: e.target.value }))
                }
                className="modern-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✍️ Author Filter
              </label>
              <input
                type="text"
                placeholder="Author pubkey or name"
                value={filters.author}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, author: e.target.value }))
                }
                className="modern-input w-full"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => handleSearch(query, true)}
                disabled={loading || !query.trim()}
                className="modern-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading loading-spinner loading-sm"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  "🔍 Advanced Search"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results && <div className="space-y-4">{renderSearchResults()}</div>}
    </div>
  );
};

export default SearchComponent;
