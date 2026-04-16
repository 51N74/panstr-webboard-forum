"use client";

import React, {
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNostrAuth } from "../../context/NostrAuthContext";
import { getRoomById, getCategoryByRoomId, isTagValidForRoom } from "../../data/boardsConfig";
import {
  initializePool,
  publishThread,
  initializeBrowserExtension,
  generateThreadId,
  htmlToMarkdown,
} from "../../lib/nostrClient";

import RichTextEditor from "../../components/RichTextEditor";

/**
 * CreateThreadPage - Panstr Minimal
 * Streamlined thread creation with room isolation
 */

export default function CreateThreadPage({ roomId }) {
  const router = useRouter();
  const { user } = useNostrAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const editorApiRef = useRef(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const room = getRoomById(roomId);
  const category = getCategoryByRoomId(roomId);

  useEffect(() => {
    if (!room) router.push("/");
  }, [room, router]);

  useEffect(() => {
    if (!user) {
      setError("Please connect your Nostr account to create a thread.");
    } else {
      setError("");
    }
  }, [user]);

  const sanitizeHtml = (html) => {
    if (!html) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      doc.querySelectorAll("script, iframe, object, embed").forEach((n) => n.remove());
      return doc.body.innerHTML;
    } catch (e) {
      return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    }
  };

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
            if (res && res.url) { resolve({ url: res.url }); return; }
          } catch (e) {}
        }
        resolve({ url: URL.createObjectURL(file) });
      };
      xhr.onerror = () => resolve({ url: URL.createObjectURL(file) });
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.send(form);
    });

  const handleUploadFromEditor = async (file, uploadId) => {
    const id = Math.random().toString(36).slice(2);
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => [...prev, { id, previewUrl, uploading: true, progress: 0, uploadId }]);
    setUploading(true);

    const result = await uploadImage(file, (p) => {
      setImages((prev) => prev.map((it) => it.uploadId === uploadId ? { ...it, progress: p } : it));
    });

    setImages((prev) => prev.map((it) => it.uploadId === uploadId ? { ...it, uploading: false, progress: 100, url: result.url } : it));

    if (editorApiRef.current?.replaceImageSrc) {
      editorApiRef.current.replaceImageSrc(uploadId, result.url);
    }
    setUploading(false);
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
    if (!user) return;
    const plain = getPlainLength(content);
    if (!title.trim() || plain === 0) {
      setError("Please fill in both title and content.");
      return;
    }

    setIsPublishing(true);
    setError("");

    try {
      await initializeBrowserExtension().catch(() => {});
      const pool = await initializePool();
      const threadId = generateThreadId(title);
      const storedHexKey = localStorage.getItem("nostr_private_key");

      let privateKeyBytes = null;
      if (storedHexKey) {
        privateKeyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
        }
      }

      if (!privateKeyBytes) throw new Error("No private key available for signing");

      const markdownContent = htmlToMarkdown(sanitizeHtml(content));
      const roomTags = [['room', roomId], ['category', room.category]];

      const signedEvent = await publishThread(pool, undefined, privateKeyBytes, {
        threadId, title, roomId, content: markdownContent, tags: roomTags, published_at: Math.floor(Date.now() / 1000),
      });

      if (signedEvent?.id) {
        setSuccess(true);
        setTimeout(() => router.push(`/room/${roomId}`), 1500);
      }
    } catch (err) {
      setError(`Failed to publish: ${err?.message || err}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!room) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Context Header */}
      <header className="room-context-header">
        <div className="max-w-screen-md mx-auto px-6">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest mb-6">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="text-surface-border">/</span>
            <Link href={`/room/${roomId}`} className="hover:text-primary">{room.name}</Link>
            <span className="text-surface-border">/</span>
            <span className="text-primary">New Thread</span>
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-muted rounded-lg border border-surface-border flex items-center justify-center text-2xl">
              {room.icon}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">Create Thread</h1>
              <p className="text-xs text-secondary">Posting to {room.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 pb-20">
        {error && (
          <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-md text-xs font-bold text-error animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-success/5 border border-success/20 rounded-md text-xs font-bold text-success animate-fade-in">
            Thread published! Redirecting...
          </div>
        )}

        <div className="space-y-8">
          <section className="space-y-2">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your thread a clear title"
              className="input text-lg font-bold placeholder:font-medium"
              disabled={!user || isPublishing}
            />
          </section>

          <section className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Content</label>
              <button 
                onClick={() => setPreviewMode(!previewMode)}
                className="text-[10px] font-bold text-accent uppercase tracking-tight hover:underline"
              >
                {previewMode ? "Edit Mode" : "Preview Mode"}
              </button>
            </div>

            {previewMode ? (
              <div className="p-6 border border-surface-border rounded-md bg-surface-muted/30 min-h-[300px]">
                <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
              </div>
            ) : (
              <div className="space-y-4">
                <RichTextEditor
                  ref={editorApiRef}
                  value={content}
                  onChange={setContent}
                  disabled={!user || isPublishing}
                  onUpload={handleUploadFromEditor}
                />
                
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map(img => (
                      <div key={img.id} className="relative w-16 h-16 rounded border border-surface-border overflow-hidden bg-surface-muted">
                        <img src={img.previewUrl} className="w-full h-full object-cover" alt="" />
                        {img.uploading && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-accent border-t-transparent animate-spin rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <footer className="pt-6 border-t border-surface-border flex justify-end gap-3">
            <Link href={`/room/${roomId}`} className="btn-ghost">Cancel</Link>
            <button 
              onClick={handlePublish}
              disabled={isPublishing || !user || !title.trim() || getPlainLength(content) === 0}
              className="btn-primary min-w-[120px]"
            >
              {isPublishing ? "Syncing..." : "Publish Thread"}
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}
