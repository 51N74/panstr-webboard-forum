/**
 * Wiki Interface Component
 * Main interface for the wiki system with collaborative editing and version control
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getWikiPages,
  getWikiPageVersions,
  getWikiCategories,
  getWikiComments,
  searchWikiPages,
  getWikiTemplates,
  PAGE_STATUS,
  EDIT_TYPES
} from '../../lib/wiki/nip54.js';

export default function WikiInterface({ userPubkey, privateKey }) {
  const [pages, setPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [selectedComments, setSelectedComments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    loadWikiData();
  }, [userPubkey, selectedCategory]);

  const loadWikiData = async () => {
    try {
      setLoading(true);
      const [wikiPages, wikiCategories, wikiTemplates] = await Promise.all([
        getWikiPages(selectedCategory === 'all' ? null : selectedCategory, PAGE_STATUS.PUBLISHED),
        getWikiCategories(),
        getWikiTemplates()
      ]);

      setPages(wikiPages);
      setCategories(wikiCategories);
      setTemplates(wikiTemplates);
    } catch (error) {
      console.error('Error loading wiki data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = async (page) => {
    setSelectedPage(page);
    try {
      const [versions, comments] = await Promise.all([
        getWikiPageVersions(page.pageId),
        getWikiComments(page.pageId)
      ]);
      setSelectedVersions(versions);
      setSelectedComments(comments);
    } catch (error) {
      console.error('Error loading page details:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const searchResults = await searchWikiPages(
        searchQuery,
        selectedCategory === 'all' ? null : selectedCategory
      );
      setPages(searchResults);
    } catch (error) {
      console.error('Error searching wiki:', error);
    }
  };

  const handlePageEdit = (page) => {
    setEditingPage(page);
    setActiveTab('edit');
  };

  const handlePageSave = async (pageData) => {
    // This would integrate with the wiki publishing functions
    console.log('Saving page:', pageData);
    setEditingPage(null);
    setActiveTab('browse');
    await loadWikiData();
  };

  const handlePageCreate = () => {
    setEditingPage(null);
    setActiveTab('create');
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      [PAGE_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
      [PAGE_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
      [PAGE_STATUS.ARCHIVED]: 'bg-yellow-100 text-yellow-800',
      [PAGE_STATUS.DELETED]: 'bg-red-100 text-red-800',
      [PAGE_STATUS.UNDER_REVIEW]: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getEditTypeBadgeColor = (editType) => {
    const colors = {
      [EDIT_TYPES.CREATE]: 'bg-green-100 text-green-800',
      [EDIT_TYPES.EDIT]: 'bg-blue-100 text-blue-800',
      [EDIT_TYPES.MINOR_EDIT]: 'bg-gray-100 text-gray-800',
      [EDIT_TYPES.REVERT]: 'bg-yellow-100 text-yellow-800',
      [EDIT_TYPES.MERGE]: 'bg-purple-100 text-purple-800'
    };
    return colors[editType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wiki</h1>
              <p className="text-gray-600 mt-1">Collaborative knowledge base</p>
            </div>
            <div className="flex items-center space-x-4">
              {userPubkey && (
                <button
                  onClick={handlePageCreate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Page
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search wiki pages..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Browse Pages
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Templates ({templates.length})
            </button>
            {selectedPage && (
              <button
                onClick={() => setActiveTab('page')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'page'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {selectedPage.title}
              </button>
            )}
            {activeTab === 'page' && (
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className={`px-6 py-3 font-medium transition-colors ${
                  showVersionHistory
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Version History
              </button>
            )}
          </div>
        </div>

        {/* Browse Pages */}
        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div
                key={page.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePageSelect(page)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{page.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(page.status)}`}>
                      {page.status}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {page.page.summary || page.page.content.substring(0, 150) + '...'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span>by {page.author.substring(0, 8)}...</span>
                      <span>{selectedVersions.length} versions</span>
                    </div>
                    <span>{selectedComments.length} comments</span>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                      Read More
                    </button>
                    {userPubkey && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePageEdit(page);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">by {category.creator.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                </div>

                <p className="text-gray-700 mb-4">{category.category.description}</p>

                {category.category.parent_category && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Parent Category:</span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {category.category.parent_category}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pages in category</span>
                  <span className="font-medium text-gray-900">--</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">by {template.creator.substring(0, 8)}...</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {template.category}
                    </span>
                    {!template.isPublic && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        Private
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{template.template.description}</p>

                {template.template.variables && template.template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.template.variables.slice(0, 5).map((variable, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {variable}
                        </span>
                      ))}
                      {template.template.variables.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{template.template.variables.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Use Template
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Page View */}
        {activeTab === 'page' && selectedPage && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedPage.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>by {selectedPage.author.substring(0, 8)}...</span>
                      <span>Category: {selectedPage.category}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(selectedPage.status)}`}>
                        {selectedPage.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {userPubkey && (
                      <button
                        onClick={() => handlePageEdit(selectedPage)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Edit
                      </button>
                    )}
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Share
                    </button>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedPage.page.content}
                  </div>
                </div>

                {/* Page Metadata */}
                <div className="mt-8 pt-6 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedPage.page.created_at * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedPage.page.updated_at * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Words:</span>
                      <span className="ml-2 font-medium">
                        {selectedPage.page.content.split(/\s+/).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Characters:</span>
                      <span className="ml-2 font-medium">
                        {selectedPage.page.content.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Comments ({selectedComments.length})</h3>

                {selectedComments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-gray-600">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedComments.map((comment) => (
                      <div key={comment.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {comment.author.substring(0, 8)}...
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(comment.comment.created_at * 1000).toLocaleDateString()}
                          </span>
                          {comment.section && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              Section: {comment.section}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{comment.comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {userPubkey && (
                  <div className="mt-6">
                    <textarea
                      placeholder="Add a comment..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Add Comment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Version History */}
              {showVersionHistory && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Version History</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedVersions.map((version) => (
                      <div key={version.id} className="border-l-2 border-gray-200 pl-4 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            Version {version.version}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getEditTypeBadgeColor(version.editType)}`}>
                            {version.editType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          by {version.author.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          {new Date(version.created_at * 1000).toLocaleDateString()}
                        </p>
                        {version.versionData.edit_summary && (
                          <p className="text-sm text-gray-700 italic">
                            "{version.versionData.edit_summary}"
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mt-2">
                          <span>{version.versionData.word_count} words</span>
                          <span>{version.versionData.character_count} chars</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Page Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Page Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Page ID:</span>
                    <p className="text-xs font-mono text-gray-700 break-all">{selectedPage.pageId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Versions:</span>
                    <p className="font-medium text-gray-900">{selectedVersions.length}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Comments:</span>
                    <p className="font-medium text-gray-900">{selectedComments.length}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Last Modified:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedPage.page.updated_at * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedPage.page.tags && selectedPage.page.tags.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPage.page.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create/Edit Page */}
        {(activeTab === 'create' || activeTab === 'edit') && (
          <WikiEditor
            page={editingPage}
            categories={categories}
            templates={templates}
            onSave={handlePageSave}
            onCancel={() => setActiveTab('browse')}
          />
        )}
      </div>
    </div>
  );
}

// Wiki Editor Component
function WikiEditor({ page, categories, templates, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: page?.title || '',
    content: page?.page.content || '',
    summary: page?.page.summary || '',
    category: page?.category || '',
    tags: page?.page.tags || [],
    status: page?.status || 'draft',
    template: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        content: template.template.content,
        template: templateId
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {page ? 'Edit Page' : 'Create New Page'}
        </h2>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary
              </label>
              <input
                type="text"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief description of the page..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your wiki content here..."
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {formData.content.split(/\s+/).length} words, {formData.content.length} characters
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {page ? 'Update Page' : 'Create Page'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template (Optional)
              </label>
              <select
                value={formData.template}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                placeholder="Enter tags separated by commas..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">Separate multiple tags with commas</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Markdown Support</h4>
              <p className="text-sm text-gray-600 mb-3">
                This editor supports Markdown formatting:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• **Bold text** for emphasis</li>
                <li>• *Italic text* for emphasis</li>
                <li>• # Headers for structure</li>
                <li>• - Lists for organization</li>
                <li>• [Links](url) for references</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
