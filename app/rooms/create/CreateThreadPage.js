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
} from "../../lib/nostrClient";

/**
 * Lightweight contentEditable Rich Text Editor
 * - Supports basic toolbar actions (headings, bold/italic/underline, lists, align, quote, code, link)
 * - Drag & drop and file picker for images
 * - Inserts a base64 preview immediately and exposes upload-id so parent can replace src after upload
 *
 * Props:
 *  - value (HTML string)
 *  - onChange (html) => void
 *  - disabled (bool)
 *  - onUpload (file, uploadId) => void  // parent will handle upload and call editorRef.replaceImageSrc(uploadId, url)
 *
 * Exposes via ref:
 *  - replaceImageSrc(uploadId, url)
 */
const RichTextEditor = forwardRef(function RichTextEditor(
  { value, onChange, disabled, onUpload },
  ref,
) {
  const editorDiv = useRef(null);
  const fileInput = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Keep editor content in sync with controlled value
  useEffect(() => {
    if (editorDiv.current && value !== editorDiv.current.innerHTML) {
      editorDiv.current.innerHTML = value || "";
    }
  }, [value]);

  // Expose a replaceImageSrc method so parent can swap preview -> uploaded URL
  useImperativeHandle(ref, () => ({
    replaceImageSrc(uploadId, newUrl) {
      if (!editorDiv.current) return;
      const img = editorDiv.current.querySelector(
        `img[data-upload-id="${uploadId}"]`,
      );
      if (img) {
        img.src = newUrl;
        // remove the attribute as upload is complete
        img.removeAttribute("data-upload-id");
      }
    },
  }));

  const triggerChange = () => {
    if (!editorDiv.current) return;
    onChange && onChange(editorDiv.current.innerHTML);
  };

  const exec = (command, value = null) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    triggerChange();
  };

  const setHeading = (level) => {
    if (disabled) return;
    document.execCommand("formatBlock", false, `h${level}`);
    triggerChange();
  };

  const insertLink = () => {
    if (disabled) return;
    const url = prompt("Enter a URL:", "https://");
    if (url) {
      document.execCommand("createLink", false, url);
      triggerChange();
    }
  };

  const insertInlineCode = () => {
    if (disabled) return;
    const sel = window.getSelection().toString() || "code";
    document.execCommand("insertHTML", false, `<code>${sel}</code>`);
    triggerChange();
  };

  const insertCodeBlock = () => {
    if (disabled) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const pre = document.createElement("pre");
    pre.textContent = range.toString();
    range.deleteContents();
    range.insertNode(pre);
    triggerChange();
  };

  const insertImageAtCursor = (src, uploadId = null, caption = "") => {
    if (!editorDiv.current) return;
    const img = document.createElement("img");
    img.src = src;
    img.alt = caption || "image";
    img.className = "max-w-full rounded-md my-2";
    if (uploadId) img.setAttribute("data-upload-id", uploadId);

    const figure = document.createElement("figure");
    figure.className = "my-4";
    figure.appendChild(img);

    if (caption !== false) {
      const figcap = document.createElement("figcaption");
      figcap.contentEditable = "true";
      figcap.className = "text-xs text-gray-500 mt-1";
      figcap.innerText = caption || "";
      figure.appendChild(figcap);
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      editorDiv.current.appendChild(figure);
    } else {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(figure);
      // Move caret after the figure
      range.setStartAfter(figure);
      range.setEndAfter(figure);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    triggerChange();
  };

  const handleFiles = async (files) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    for (const file of imageFiles) {
      // create a unique upload id
      const uploadId = Math.random().toString(36).slice(2);
      // create base64 preview and insert immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        insertImageAtCursor(e.target.result, uploadId);
        // notify parent to upload in background
        onUpload && onUpload(file, uploadId);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || []);
    await handleFiles(files);
  };

  const onPaste = (e) => {
    // allow paste then sync content
    setTimeout(triggerChange, 0);
  };

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
    e.target.value = null;
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        <div className="inline-flex items-center rounded-md bg-base-100 border p-1">
          <button
            type="button"
            onClick={() => setHeading(1)}
            className="px-2 py-1 text-sm hover:bg-base-200 rounded"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => setHeading(2)}
            className="px-2 py-1 text-sm hover:bg-base-200 rounded"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => setHeading(3)}
            className="px-2 py-1 text-sm hover:bg-base-200 rounded"
          >
            H3
          </button>
          <span className="w-px bg-base-200 mx-1 h-6"></span>
          <button
            type="button"
            onClick={() => exec("bold")}
            className="px-2 py-1 font-bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => exec("italic")}
            className="px-2 py-1 italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => exec("underline")}
            className="px-2 py-1 underline"
          >
            U
          </button>
          <span className="w-px bg-base-200 mx-1 h-6"></span>
          <button
            type="button"
            onClick={() => exec("insertUnorderedList")}
            className="px-2 py-1"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => exec("insertOrderedList")}
            className="px-2 py-1"
          >
            1. List
          </button>
          <span className="w-px bg-base-200 mx-1 h-6"></span>
          <button
            type="button"
            onClick={() => exec("justifyLeft")}
            className="px-2 py-1"
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => exec("justifyCenter")}
            className="px-2 py-1"
          >
            Center
          </button>
          <button
            type="button"
            onClick={() => exec("justifyFull")}
            className="px-2 py-1"
          >
            Justify
          </button>
          <span className="w-px bg-base-200 mx-1 h-6"></span>
          <button
            type="button"
            onClick={() => exec("formatBlock", "blockquote")}
            className="px-2 py-1"
          >
            ❝ Quote
          </button>
          <button
            type="button"
            onClick={insertInlineCode}
            className="px-2 py-1"
          >
            `code`
          </button>
          <button type="button" onClick={insertCodeBlock} className="px-2 py-1">
            Code Block
          </button>
          <button type="button" onClick={insertLink} className="px-2 py-1">
            🔗 Link
          </button>
        </div>

        <div className="inline-flex items-center">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="rte-file-input"
          />
          <label
            htmlFor="rte-file-input"
            className="btn btn-sm btn-outline cursor-pointer"
          >
            📁 Add Image
          </label>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`min-h-[180px] p-4 border rounded-lg bg-white ${dragOver ? "border-primary/80 bg-base-100" : "border-base-200"}`}
      >
        <div
          ref={editorDiv}
          className="prose max-w-none focus:outline-none"
          contentEditable={!disabled}
          onInput={triggerChange}
          onPaste={onPaste}
          suppressContentEditableWarning={true}
          style={{ minHeight: 160 }}
        />
      </div>
    </div>
  );
});

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

      const signedEvent = await publishThread(
        pool,
        undefined,
        privateKeyBytes,
        {
          threadId,
          title,
          board: roomId,
          content: safeContent,
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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Room Not Found</h2>
          <Link href="/" className="btn btn-primary">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  const plainLength = getPlainLength(content);

  return (
    <div className="min-h-screen bg-base-200">
      <div className={`bg-gradient-to-r ${room.gradient} text-white p-8`}>
        <div className="container mx-auto">
          <nav className="flex items-center space-x-2 text-sm mb-4 opacity-90">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>›</span>
            <Link href={`/category/${category.id}`} className="hover:underline">
              {category.name}
            </Link>
            <span>›</span>
            <Link href={`/room/${roomId}`} className="hover:underline">
              {room.name}
            </Link>
            <span>›</span>
            <span>Create Thread</span>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="text-4xl">{room.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">Create New Thread</h1>
              <p className="text-white/90">
                Share your thoughts with the {room.name} community
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <div className="alert alert-error mb-6">
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
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <svg
              className="w-6 h-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Thread published successfully! Redirecting...</span>
          </div>
        )}

        {!user && (
          <div className="alert alert-warning mb-6">
            <svg
              className="w-6 h-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>
              You need to connect your Nostr account to create threads.
            </span>
            <div className="flex-1" />
            <Link href="/" className="btn btn-sm btn-warning">
              Connect Account
            </Link>
          </div>
        )}

        <div className="bg-base-100 rounded-lg shadow-sm">
          <div className="p-6 border-b border-base-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{room.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold">{room.name}</h2>
                  <p className="text-sm text-base-content/70">New Thread</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewMode((p) => !p)}
                className={`btn btn-sm ${previewMode ? "btn-primary" : "btn-outline"}`}
              >
                {previewMode ? "Edit" : "Preview"}
              </button>
            </div>
          </div>

          {!previewMode ? (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Thread Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter an engaging title for your thread..."
                  className="w-full px-4 py-3 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={200}
                  disabled={!user}
                />
                <div className="mt-1 text-xs text-base-content/60 text-right">
                  {title.length}/200
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Content <span className="text-red-500">*</span>
                </label>

                <div className="mb-3 border-dashed border-2 border-base-300 rounded-lg p-3 bg-base-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-base-content/70">
                      Rich text editor — use the toolbar to format. Drag & drop
                      images or click to upload.
                    </div>
                    <div className="text-xs text-base-content/60">
                      {plainLength} characters
                    </div>
                  </div>

                  <RichTextEditor
                    ref={editorApiRef}
                    value={content}
                    onChange={setContent}
                    disabled={!user}
                    onUpload={handleUploadFromEditor}
                  />

                  <div className="mt-3 flex items-center space-x-3">
                    <div className="text-xs text-base-content/60">
                      Supported: JPG, PNG, GIF, WebP
                    </div>
                    {uploading && (
                      <div className="text-sm text-base-content/70">
                        Uploading image...
                      </div>
                    )}
                  </div>

                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className="border rounded p-2 bg-white"
                        >
                          <img
                            src={img.previewUrl}
                            alt="preview"
                            className="w-full h-24 object-cover rounded"
                          />
                          <div className="mt-2">
                            {img.uploading ? (
                              <div className="text-xs text-base-content/60">
                                Uploading: {img.progress}%
                              </div>
                            ) : (
                              <div className="text-xs text-base-content/70">
                                Uploaded
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-base-300">
                <Link href={`/room/${roomId}`} className="btn btn-outline">
                  Cancel
                </Link>
                <button
                  onClick={handlePublish}
                  disabled={
                    isPublishing || !user || !title.trim() || plainLength === 0
                  }
                  className="btn btn-primary"
                >
                  {isPublishing ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading loading-spinner loading-sm" />
                      <span>Publishing...</span>
                    </div>
                  ) : (
                    "Publish Thread"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="prose max-w-none">
                {title && <h1 className="text-3xl font-bold mb-4">{title}</h1>}
                {content ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                  />
                ) : (
                  <div className="text-center py-12 text-base-content/50">
                    <div className="text-lg mb-2">No content yet</div>
                    <div className="text-sm">
                      Add a title and content to see the preview
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-base-300">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="btn btn-outline"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handlePublish}
                  disabled={
                    isPublishing || !user || !title.trim() || plainLength === 0
                  }
                  className="btn btn-primary"
                >
                  {isPublishing ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading loading-spinner loading-sm" />
                      <span>Publishing...</span>
                    </div>
                  ) : (
                    "Publish Thread"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-base-100 rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <span className="text-xl mr-2">💡</span> Tips for Great Threads
          </h3>
          <ul className="space-y-2 text-sm text-base-content/70">
            <li>• Use a clear and descriptive title</li>
            <li>• Break your content into paragraphs for readability</li>
            <li>• Use formatting tools to structure your post</li>
            <li>• Add images to illustrate your point</li>
            <li>• Be respectful and constructive</li>
            <li>• Check your content before publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
