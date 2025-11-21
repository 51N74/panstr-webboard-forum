"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  StarIcon,
  CalendarIcon,
  TagIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  SparklesIcon,
  UsersIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { useNostr } from "../context/NostrContext";
import { getAppHandlers, createAppHandler } from "../lib/nostrClient";
import AppCard from "../components/apps/AppCard";
import AppCategories from "../components/apps/AppCategories";
import AppRecommender from "../components/apps/AppRecommender";

export default function AppsPage() {
  const router = useRouter();
  const { pool, relayUrls, user } = useNostr();
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // App categories based on NIP-89 types
  const categories = [
    { id: "all", label: "All Apps", icon: GlobeAltIcon, count: 0 },
    { id: "app", label: "Applications", icon: Cog6ToothIcon, count: 0 },
    { id: "bot", label: "Bots", icon: SparklesIcon, count: 0 },
    { id: "service", label: "Services", icon: UsersIcon, count: 0 },
    { id: "game", label: "Games", icon: ChartBarIcon, count: 0 },
    { id: "tool", label: "Tools", icon: Cog6ToothIcon, count: 0 }
  ];

  // Sort options
  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "popular", label: "Most Popular" },
    { value: "name", label: "Name (A-Z)" },
    { value: "type", label: "Type" }
  ];

  // Load apps from NIP-89 handlers
  useEffect(() => {
    loadApps();
  }, []);

  // Filter apps based on search and category
  useEffect(() => {
    let filtered = [...apps];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(app => app.kind === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort apps
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.created_at - a.created_at;
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.kind.localeCompare(b.kind);
        case "popular":
          return (b.stars || 0) - (a.stars || 0);
        default:
          return 0;
      }
    });

    setFilteredApps(filtered);
  }, [apps, searchQuery, selectedCategory, sortBy]);

  const loadApps = async () => {
    setLoading(true);
    try {
      const result = await getAppHandlers(pool, relayUrls);
      const allApps = [];

      // Flatten apps from different categories
      result.apps.forEach(category => {
        category.apps.forEach(app => {
          allApps.push({
            ...app,
            category: category.type,
            stars: Math.floor(Math.random() * 100), // Mock rating data
            downloads: Math.floor(Math.random() * 10000),
            lastUpdated: new Date(app.created_at * 1000).toISOString()
          });
        });
      });

      setApps(allApps);

      // Update category counts
      const updatedCategories = categories.map(cat => ({
        ...cat,
        count: cat.id === "all" ? allApps.length : allApps.filter(app => app.kind === cat.id).length
      }));

    } catch (error) {
      console.error("Failed to load apps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async (appData) => {
    if (!user || !user.privateKeyBytes) {
      router.push("/login");
      return;
    }

    try {
      const result = await createAppHandler(pool, relayUrls, appData, user.privateKeyBytes);
      console.log("App created:", result);
      setShowCreateForm(false);
      await loadApps(); // Refresh apps list
    } catch (error) {
      console.error("Failed to create app:", error);
    }
  };

  const handleAppAction = (appId, action) => {
    switch (action) {
      case "install":
        console.log("Install app:", appId);
        // Implement app installation logic
        break;
      case "view":
        router.push(`/apps/${appId}`);
        break;
      case "share":
        navigator.clipboard.writeText(`https://panstr.app/apps/${appId}`);
        // Show toast notification
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-base-content/70">Loading apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RocketLaunchIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-base-content">App Directory</h1>
                <p className="text-base-content/70">Discover and install Nostr apps and services</p>
              </div>
            </div>

            {user && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                Create App
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full pl-10 pr-4 py-3 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Categories and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Categories */}
            <AppCategories
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            {/* Sort Options */}
            <div className="flex items-center space-x-3">
              <label className="text-sm text-base-content/70">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select select-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-base-100 rounded-lg border border-base-300 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{apps.length}</div>
              <div className="text-sm text-base-content/70">Total Apps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{filteredApps.length}</div>
              <div className="text-sm text-base-content/70">Filtered Results</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">
                {apps.filter(app => app.kind === "app").length}
              </div>
              <div className="text-sm text-base-content/70">Applications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {apps.filter(app => app.kind === "bot").length}
              </div>
              <div className="text-sm text-base-content/70">Bots & Services</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {!searchQuery && selectedCategory === "all" && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-base-content mb-4">Recommended for You</h2>
            <AppRecommender
              apps={apps}
              onAppSelect={(appId) => handleAppAction(appId, "view")}
            />
          </div>
        )}

        {/* Apps Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-base-content">
              {searchQuery && `Search Results (${filteredApps.length})`}
              {!searchQuery && selectedCategory !== "all" &&
                `${categories.find(c => c.id === selectedCategory)?.label} (${filteredApps.length})`
              }
              {!searchQuery && selectedCategory === "all" && "All Apps"}
            </h2>
          </div>

          {filteredApps.length === 0 ? (
            <div className="bg-base-100 rounded-lg border border-base-300 p-8 text-center">
              <RocketLaunchIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
              <h3 className="text-lg font-medium text-base-content mb-2">No apps found</h3>
              <p className="text-base-content/70 mb-4">
                {searchQuery ? "Try adjusting your search terms" : "No apps available in this category"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="btn btn-ghost"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map(app => (
                <AppCard
                  key={app.id}
                  app={app}
                  onAction={handleAppAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create App Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-base-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-base-content">Create New App</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn btn-ghost btn-sm"
              >
                ✕
              </button>
            </div>

            <CreateAppForm
              onSubmit={handleCreateApp}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Create App Form Component
function CreateAppForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    icon: "",
    type: "app",
    tags: [],
    supports: []
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        identifier: formData.name.toLowerCase().replace(/\s+/g, "-")
      });
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-base-content mb-1">App Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full input input-bordered"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-base-content mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full textarea textarea-bordered"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-base-content mb-1">App Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full select select-bordered"
        >
          <option value="app">Application</option>
          <option value="bot">Bot</option>
          <option value="service">Service</option>
          <option value="game">Game</option>
          <option value="tool">Tool</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-base-content mb-1">Website URL</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full input input-bordered"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-base-content mb-1">Icon URL</label>
        <input
          type="url"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full input input-bordered"
          placeholder="https://example.com/icon.png"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-base-content mb-1">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="flex-1 input input-bordered input-sm"
            placeholder="Add tag and press Enter"
          />
          <button type="button" onClick={addTag} className="btn btn-sm btn-primary">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {formData.tags.map(tag => (
            <span key={tag} className="badge badge-primary badge-sm">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-error"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting && <span className="loading loading-spinner loading-sm"></span>}
          Create App
        </button>
      </div>
    </form>
  );
}
