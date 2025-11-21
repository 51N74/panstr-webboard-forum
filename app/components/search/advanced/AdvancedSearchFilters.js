"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ClockIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useNostr } from "../../../context/NostrContext";

const AdvancedSearchFilters = ({ onSearch, onFiltersChange, initialFilters = {} }) => {
  const { pool, relayUrls } = useNostr();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Search state
  const [query, setQuery] = useState(initialFilters.query || "");
  const [filters, setFilters] = useState({
    // Content filters
    kinds: initialFilters.kinds || [1, 30023], // Text notes and forum threads
    authors: initialFilters.authors || [],
    tags: initialFilters.tags || [],

    // Date filters
    dateRange: initialFilters.dateRange || {
      start: null,
      end: null
    },

    // Search options
    sortBy: initialFilters.sortBy || "relevance", // relevance, created_at, popularity
    sortOrder: initialFilters.sortOrder || "desc", // desc, asc
    limit: initialFilters.limit || 20,
    offset: initialFilters.offset || 0,

    // Advanced NIP-50 options
    includeProfiles: initialFilters.includeProfiles || false,
    geohash: initialFilters.geohash || "",

    // UI state
    timeRange: initialFilters.timeRange || "all" // all, 1h, 24h, 7d, 30d, 90d
  });

  // Preset time ranges
  const timeRanges = {
    all: { label: "All Time", value: "all" },
    "1h": { label: "Last Hour", value: "1h" },
    "24h": { label: "Last 24 Hours", value: "24h" },
    "7d": { label: "Last 7 Days", value: "7d" },
    "30d": { label: "Last 30 Days", value: "30d" },
    "90d": { label: "Last 90 Days", value: "90d" }
  };

  // Content kind options
  const kindOptions = [
    { id: 1, label: "Text Notes", description: "Regular posts and messages" },
    { id: 30023, label: "Forum Threads", description: "Long-form content and discussions" },
    { id: 6, label: "Reactions", description: "Likes and emoji reactions" },
    { id: 7, label: "Deletion Requests", description: "Content removal requests" },
    { id: 9734, label: "Zap Requests", description: "Lightning payment requests" },
    { id: 9735, label: "Zap Receipts", description: "Lightning payment confirmations" }
  ];

  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance", description: "Most relevant results first" },
    { value: "created_at", label: "Date", description: "Most recent first" },
    { value: "popularity", label: "Popularity", description: "Most interacted content first" }
  ];

  // Update filters and notify parent
  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    if (onFiltersChange) {
      onFiltersChange(updatedFilters);
    }
  };

  // Handle search execution
  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim() && filters.authors.length === 0 && filters.tags.length === 0) {
      return;
    }

    setIsLoading(true);

    try {
      // Apply time range if selected
      let dateRange = { ...filters.dateRange };
      if (filters.timeRange !== "all") {
        const now = new Date();
        let start = null;

        switch (filters.timeRange) {
          case "1h":
            start = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case "24h":
            start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "7d":
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "90d":
            start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        }

        dateRange.start = start;
      }

      const searchParams = {
        query: searchQuery.trim(),
        ...filters,
        dateRange,
        authors: filters.authors.map(author => author.trim()).filter(Boolean),
        tags: filters.tags.map(tag => tag.trim()).filter(Boolean),
        kinds: filters.kinds.length > 0 ? filters.kinds : [1, 30023]
      };

      if (onSearch) {
        await onSearch(searchParams);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key in search input
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Add/remove author filter
  const toggleAuthor = (author) => {
    const authors = filters.authors.includes(author)
      ? filters.authors.filter(a => a !== author)
      : [...filters.authors, author];
    updateFilters({ authors });
  };

  // Add/remove tag filter
  const toggleTag = (tag) => {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags });
  };

  // Add new tag
  const addTag = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      const newTag = e.target.value.trim();
      if (!filters.tags.includes(newTag)) {
        updateFilters({ tags: [...filters.tags, newTag] });
      }
      e.target.value = "";
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setQuery("");
    setFilters({
      kinds: [1, 30023],
      authors: [],
      tags: [],
      dateRange: { start: null, end: null },
      sortBy: "relevance",
      sortOrder: "desc",
      limit: 20,
      offset: 0,
      includeProfiles: false,
      geohash: "",
      timeRange: "all"
    });
  };

  return (
    <div className="bg-base-100 rounded-lg border border-base-300 shadow-sm">
      {/* Search Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search content, users, or topics..."
              className="w-full pl-10 pr-4 py-2 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "Search"
            )}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn btn-ghost"
            title="Advanced Filters"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Active Filters Display */}
        {(filters.authors.length > 0 || filters.tags.length > 0 || filters.timeRange !== "all") && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.authors.map(author => (
              <span key={author} className="badge badge-primary gap-1">
                <UserIcon className="w-3 h-3" />
                {author.slice(0, 8)}...
                <button
                  onClick={() => toggleAuthor(author)}
                  className="ml-1 hover:text-error"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.tags.map(tag => (
              <span key={tag} className="badge badge-secondary gap-1">
                <TagIcon className="w-3 h-3" />
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 hover:text-error"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.timeRange !== "all" && (
              <span className="badge badge-accent gap-1">
                <ClockIcon className="w-3 h-3" />
                {timeRanges[filters.timeRange].label}
              </span>
            )}
            <button
              onClick={resetFilters}
              className="badge badge-outline hover:bg-base-200"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isOpen && (
        <div className="p-4 border-t border-base-300 bg-base-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Content Types */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                <DocumentTextIcon className="inline w-4 h-4 mr-1" />
                Content Types
              </label>
              <div className="space-y-2">
                {kindOptions.map(kind => (
                  <label key={kind.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.kinds.includes(kind.id)}
                      onChange={(e) => {
                        const kinds = e.target.checked
                          ? [...filters.kinds, kind.id]
                          : filters.kinds.filter(k => k !== kind.id);
                        updateFilters({ kinds });
                      }}
                      className="checkbox checkbox-sm"
                    />
                    <div>
                      <span className="text-sm">{kind.label}</span>
                      <span className="text-xs text-base-content/50 block">{kind.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-1" />
                Time Range
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => updateFilters({ timeRange: e.target.value })}
                className="w-full select select-sm"
              >
                {Object.values(timeRanges).map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              {/* Custom Date Range */}
              <div className="mt-3 space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start ? new Date(filters.dateRange.start).toISOString().split('T')[0] : ""}
                  onChange={(e) => {
                    const start = e.target.value ? new Date(e.target.value) : null;
                    updateFilters({ dateRange: { ...filters.dateRange, start } });
                  }}
                  className="w-full input input-sm"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={filters.dateRange.end ? new Date(filters.dateRange.end).toISOString().split('T')[0] : ""}
                  onChange={(e) => {
                    const end = e.target.value ? new Date(e.target.value) : null;
                    updateFilters({ dateRange: { ...filters.dateRange, end } });
                  }}
                  className="w-full input input-sm"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="w-full select select-sm mb-2"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilters({ sortOrder: e.target.value })}
                className="w-full select select-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>

              <div className="mt-3">
                <label className="text-sm text-base-content/70">Results per page</label>
                <select
                  value={filters.limit}
                  onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
                  className="w-full select select-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                <TagIcon className="inline w-4 h-4 mr-1" />
                Tags
              </label>
              <input
                type="text"
                placeholder="Add tag and press Enter"
                onKeyPress={addTag}
                className="w-full input input-sm mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {filters.tags.map(tag => (
                  <span key={tag} className="badge badge-secondary badge-sm">
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="ml-1 hover:text-error"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Authors Filter */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                <UserIcon className="inline w-4 h-4 mr-1" />
                Authors
              </label>
              <input
                type="text"
                placeholder="Enter npub or pubkey"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    toggleAuthor(e.target.value.trim());
                    e.target.value = "";
                  }
                }}
                className="w-full input input-sm mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {filters.authors.map(author => (
                  <span key={author} className="badge badge-primary badge-sm">
                    {author.slice(0, 8)}...
                    <button
                      onClick={() => toggleAuthor(author)}
                      className="ml-1 hover:text-error"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Advanced Options
              </label>
              <label className="flex items-center space-x-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={filters.includeProfiles}
                  onChange={(e) => updateFilters({ includeProfiles: e.target.checked })}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Include author profiles</span>
              </label>

              <div>
                <label className="text-sm text-base-content/70">Geohash (location-based)</label>
                <input
                  type="text"
                  value={filters.geohash}
                  onChange={(e) => updateFilters({ geohash: e.target.value })}
                  placeholder="e.g., u4pruyd"
                  className="w-full input input-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-base-300">
            <button
              onClick={resetFilters}
              className="btn btn-ghost btn-sm"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-sm"
            >
              Close Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilters;
