"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNostrAuth } from "../context/NostrAuthContext";
import {
  publishToPool,
  initializePool,
  formatPubkey,
} from "../lib/nostrClient";

export default function CommentsForm({ postId }) {
  const { user, error, isLoading } = useNostrAuth();
  const [content, setContent] = useState("");
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCommentPost = async (e) => {
    e.preventDefault();

    if (!content || !postId || !user) {
      alert("Please connect to Nostr and write a comment.");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Publishing comment with Nostr...");
      console.log("Content:", content);
      console.log("Post ID:", postId);
      console.log("User pubkey:", user.pubkey);

      // Initialize pool
      const pool = await initializePool();

      // Create reply event (kind 1) that references the original post
      const replyTags = [
        ["e", postId], // Reference to the original post
        ["p", postId.split(":")[1] || postId], // Reference to the post author (fallback to postId)
      ];

      // Publish comment as a Nostr event
      const signedEvent = await publishToPool(
        pool,
        undefined, // Use default relays
        user.authMethod === "privatekey"
          ? localStorage.getItem("nostr_private_key")
          : null,
        content,
        {
          kind: 1, // Text note (comment/reply)
          tags: replyTags,
        },
      );

      if (signedEvent) {
        // Add comment to local state
        const newComment = {
          id: signedEvent.id,
          content: content,
          postId: postId,
          author: {
            pubkey: user.pubkey,
            name: user.display_name || user.name,
            picture: user.picture,
            npub: user.npub,
          },
          created_at: signedEvent.created_at,
        };

        setComments((prevComments) => [...prevComments, newComment]);

        alert("Comment published successfully!");
        setContent("");
        router.refresh();
      } else {
        throw new Error("Failed to publish comment to relays");
      }
    } catch (error) {
      console.error("Error publishing comment:", error);
      alert(`Failed to publish comment: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading loading-spinner loading-md"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Connect to Nostr to Comment
        </h3>
        <p className="text-yellow-700 mb-4">
          You need to connect your Nostr account to participate in discussions.
        </p>
        <div className="text-sm text-yellow-600">
          Use the "Connect Nostr" button in the header to sign in.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCommentPost} className="space-y-4">
      <div className="bg-base-100 rounded-lg p-6 shadow-sm border">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img
                src={user.picture}
                alt={user.display_name || user.name}
                onError={(e) => {
                  e.target.src = `https://robohash.org/${user.pubkey}.png`;
                }}
              />
            </div>
          </div>
          <div>
            <div className="font-semibold">
              {user.display_name || user.name}
            </div>
            <div className="text-xs text-gray-500">
              {formatPubkey(user.pubkey, "short")}
            </div>
          </div>
        </div>

        {/* Comment Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Write a comment</span>
          </label>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="textarea textarea-bordered resize-none focus:textarea-primary"
            disabled={isSubmitting}
            required
          ></textarea>
          <div className="label">
            <span className="label-text-alt text-gray-500">
              Your comment will be published to the Nostr network
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Publishing...
              </>
            ) : (
              "Publish Comment"
            )}
          </button>
        </div>
      </div>

      {/* Display existing comments if any */}
      {comments.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="font-semibold text-lg">Recent Comments</h3>
          {comments.map((comment, index) => (
            <div
              key={comment.id || index}
              className="bg-base-100 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <img
                      src={comment.author.picture}
                      alt={comment.author.name}
                      onError={(e) => {
                        e.target.src = `https://robohash.org/${comment.author.pubkey}.png`;
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at * 1000).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
