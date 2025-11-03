"use client";

import { useState } from "react";
import Link from "next/link";
import EnhancedNostrWidget from "./NostrWidget";

export default function NostrClientComponent({ blogs }) {
  const [recentNostrPosts, setRecentNostrPosts] = useState([]);

  const handleNewNostrPost = (event) => {
    console.log("New Nostr post:", event);
    setRecentNostrPosts((prev) => [event, ...prev].slice(0, 10));
  };

  return (
    <>
      <p className="text-xl bg-slate-300 p-2 text-center">Hot Zap</p>
      <div className="bg-slate-100">
        {blogs.map((blog, index) => (
          <div key={index}>
            <Link href={`/contents/blog/${blog.id}`}>
              <div className="p-2 border-b-2 border-indigo-100">
                <p>{blog.title}</p>
                <p>กระทู้โดย : {blog.name}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Show recent Nostr posts */}
      {recentNostrPosts.length > 0 && (
        <div className="mt-4 bg-slate-100 rounded p-2">
          <h4 className="font-medium mb-2">Recent Nostr Posts</h4>
          {recentNostrPosts.map((post) => (
            <div key={post.id} className="mb-2 p-2 border-b">
              <div className="text-xs text-gray-500">
                {post.pubkey.slice(0, 8)}...
              </div>
              <div className="text-sm truncate">{post.content}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <EnhancedNostrWidget onNewPost={handleNewNostrPost} />
      </div>
    </>
  );
}
