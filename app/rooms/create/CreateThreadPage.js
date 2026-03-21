"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNostrAuth } from "../../context/NostrAuthContext";
import { getRoomById, getCategoryByRoomId } from "../../data/boardsConfig";
import {
  initializePool,
  publishThread,
  initializeBrowserExtension,
  generateThreadId,
  htmlToMarkdown,
} from "../../lib/nostrClient";

import RichTextEditor from "../../components/RichTextEditor";

/* =============================
   CreateThreadPage (page)
   ============================= */

export default function CreateThreadPage({ roomId }) {
  const router = useRouter();
  const { user } = useNostrAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // html
  const editorApiRef = useRef(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // image upload state for thumbnails/progress
  const [images, setImages] = useState([]); // { id, file, previewUrl, uploading, progress, url, uploadId }
  const [uploading, setUploading] = useState(false);

  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room) {
      router.push("/");
    }
  }, [room, router]);

  useEffect(() => {
    if (!user) {
      setError("Please connect your Nostr account to create a thread.");
    } else {
      setError("");
    }
  }, [user]);

  // Basic client-side sanitizer — for robust protection sanitize on server as well
  const sanitizeHtml = (html) => {
    if (!html) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      doc
        .querySelectorAll("script, iframe, object, embed")
        .forEach((n) => n.remove());
      doc.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
        });
      });
      // neutralize javascript: URIs
      doc.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && href.trim().toLowerCase().startsWith("javascript:")) {
          a.setAttribute("href", "#");
        }
      });
      return doc.body.innerHTML;
    } catch (e) {
      return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    }
  };

  // Upload helper with progress reporting; expects server endpoint /api/uploads/images
  const uploadImage = (file, onProgress) =>
    new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("image", file);
      xhr.open("POST", "/api/uploads/images");
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res && res.url) {
              resolve({ url: res.url });
              return;
            }
          } catch (e) {
            // parse error -> fallback
          }
        }
        resolve({ url: URL.createObjectURL(file) });
      };
      xhr.onerror = () => {
        resolve({ url: URL.createObjectURL(file) });
      };
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.send(form);
    });

  // Called by RichTextEditor when a file is dropped/selected; parent uploads and replaces preview when done
  const handleUploadFromEditor = async (file, uploadId) => {
    // create local entry for thumbnail/progress
    const id = Math.random().toString(36).slice(2);
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => [
      ...prev,
      {
        id,
        file,
        previewUrl,
        uploading: true,
        progress: 0,
        url: null,
        uploadId,
      },
    ]);
    setUploading(true);

    const result = await uploadImage(file, (p) => {
      setImages((prev) =>
        prev.map((it) =>
          it.uploadId === uploadId ? { ...it, progress: p } : it,
        ),
      );
    });

    setImages((prev) =>
      prev.map((it) =>
        it.uploadId === uploadId
          ? { ...it, uploading: false, progress: 100, url: result.url }
          : it,
      ),
    );

    // replace base64 preview inserted by the editor with the uploaded URL
    try {
      // The editor exposes replaceImageSrc via its ref
      if (
        editorApiRef.current &&
        typeof editorApiRef.current.replaceImageSrc === "function"
      ) {
        editorApiRef.current.replaceImageSrc(uploadId, result.url);
      } else {
        // As a fallback, replace in content state directly (best-effort)
        setContent((prev) =>
          prev.replace(
            new RegExp(`src=["']data:[^"']+["']`),
            `src="${result.url}"`,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to replace preview with uploaded image url:", e);
    } finally {
      setUploading(false);
    }
  };

  const getPlainLength = (html) => {
    try {
      const tmp = document.createElement("div");
      tmp.innerHTML = html || "";
      return (tmp.textContent || tmp.innerText || "").trim().length;
    } catch (e) {
      return (html || "").replace(/<[^>]+>/g, "").trim().length;
    }
  };

  const handlePublish = async () => {
    if (!user) {
      setError("Please connect your Nostr account to create a thread.");
      return;
    }

    const plain = getPlainLength(content);
    if (!title.trim() || plain === 0) {
      setError("Please fill in both title and content.");
      return;
    }
    if (title.length > 200) {
      setError("Title must be less than 200 characters.");
      return;
    }

    setIsPublishing(true);
    setError("");

    try {
      try {
        await initializeBrowserExtension();
      } catch (e) {
        console.log("Browser extension not available or failed to initialize");
      }

      const pool = await initializePool();
      const threadId = generateThreadId(title);

      const storedHexKey =
        typeof window !== "undefined"
          ? localStorage.getItem("nostr_private_key")
          : null;

      let privateKeyBytes = null;
      if (storedHexKey) {
        privateKeyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
        }
      }

      if (!privateKeyBytes) {
        throw new Error("No private key available for signing");
      }

      const safeContent = sanitizeHtml(content);
      const markdownContent = htmlToMarkdown(safeContent);

      const signedEvent = await publishThread(
        pool,
        undefined,
        privateKeyBytes,
        {
          threadId,
          title,
          board: roomId,
          content: markdownContent,
          published_at: Math.floor(Date.now() / 1000),
        },
      );

      if (signedEvent && signedEvent.id) {
        setSuccess(true);
        setTimeout(() => router.push(`/room/${roomId}`), 1600);
      } else {
        throw new Error("Failed to publish thread - no event returned");
      }
    } catch (err) {
      console.error("Failed to publish thread:", err);
      setError(`Failed to publish: ${err?.message || err}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Room Not Found</h2>
          <Link href="/" className="modern-button-primary inline-block">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  const plainLength = getPlainLength(content);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className={`bg-gradient-to-r ${room.gradient} text-white py-12 shadow-lg`}>
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm mb-6 opacity-90 font-medium">
            <Link href="/" className="hover:text-white/80 transition-colors">
              Home
            </Link>
            <span className="opacity-60">›</span>
            <Link href={`/category/${category.id}`} className="hover:text-white/80 transition-colors">
              {category.name}
            </Link>
            <span className="opacity-60">›</span>
            <Link href={`/room/${roomId}`} className="hover:text-white/80 transition-colors">
              {room.name}
            </Link>
            <span className="opacity-60">›</span>
            <span className="text-white">Create Thread</span>
          </nav>

          <div className="flex items-center space-x-6">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-inner border border-white/10">
              <span className="text-5xl">{room.icon}</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2 text-shadow">Create New Thread</h1>
              <p className="text-lg text-white/90 font-medium">
                Share your thoughts with the {room.name} community
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10 max-w-5xl">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">Thread published successfully! Redirecting...</p>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-medium">
                    You need to connect your Nostr account to create threads.
                  </p>
                </div>
              </div>
              <Link href="/" className="ml-4 px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-md hover:bg-yellow-200 transition-colors">
                Connect Account
              </Link>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="modern-card bg-white overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl shadow-sm border border-gray-200">
                {room.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Compose Thread</h2>
                <p className="text-xs text-gray-500 font-medium">Posting to {room.name}</p>
              </div>
            </div>
            <button
              onClick={() => setPreviewMode((p) => !p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${previewMode
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
                }`}
            >
              {previewMode ? "Edit Mode" : "Preview Mode"}
            </button>
          </div>

          {!previewMode ? (
            <div className="p-8 space-y-8">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 ml-1">
                  Thread Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter an engaging title..."
                    className="modern-input w-full text-lg font-medium placeholder:font-normal"
                    maxLength={200}
                    disabled={!user}
                  />
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded-md ${title.length > 180 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                    }`}>
                    {title.length}/200
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-400 font-medium">
                    {plainLength} characters
                  </span>
                </div>

                <RichTextEditor
                  ref={editorApiRef}
                  value={content}
                  onChange={setContent}
                  disabled={!user}
                  onUpload={handleUploadFromEditor}
                />

                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="text-xs text-gray-400">
                    Supported: JPG, PNG, GIF, WebP
                  </div>
                  {uploading && (
                    <div className="flex items-center space-x-2 text-xs text-blue-600 font-medium animate-pulse">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                      <span>Uploading image...</span>
                    </div>
                  )}
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="aspect-square relative">
                          <img
                            src={img.previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        </div>
                        <div className="p-2 bg-white border-t border-gray-100">
                          {img.uploading ? (
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1 overflow-hidden">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${img.progress}%` }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center text-green-600 text-xs font-medium">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
                <Link
                  href={`/room/${roomId}`}
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 active:scale-95"
                >
                  Cancel
                </Link>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !user || !title.trim() || plainLength === 0}
                  className={`
                    relative overflow-hidden px-8 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 
                    transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 active:translate-y-0 active:scale-95
                    bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none
                    min-w-[160px] flex items-center justify-center group
                  `}
                >
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-full" />
                  {isPublishing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="relative z-10">Publishing...</span>
                    </>
                  ) : (
                    <span className="relative z-10">Publish Thread</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-gray-50/30 min-h-[400px]">
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                {title && <h1 className="text-3xl font-bold mb-6 text-gray-900">{title}</h1>}
                {content ? (
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-lg font-medium mb-1">No content yet</div>
                    <div className="text-sm">Add a title and content to see the preview</div>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 active:scale-95"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !user || !title.trim() || plainLength === 0}
                  className={`
                    relative overflow-hidden px-8 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 
                    transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 active:translate-y-0 active:scale-95
                    bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none
                    min-w-[160px] flex items-center justify-center group
                  `}
                >
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-full" />
                  {isPublishing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="relative z-10">Publishing...</span>
                    </>
                  ) : (
                    <span className="relative z-10">Publish Thread</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 modern-card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">💡</span>
            <span className="text-lg">Tips for Great Threads</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Use a clear, descriptive title that catches attention
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Break your content into short paragraphs for readability
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Use formatting tools (bold, lists) to structure your post
              </li>
            </ul>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Add images to illustrate your point and increase engagement
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Be respectful and constructive in your discussions
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Check your content in Preview Mode before publishing
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
