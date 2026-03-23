"use client";

import { useState, useRef, useEffect } from "react";
import { useNostrAuth } from "../context/NostrAuthContext";
import { formatPubkey, uploadFileNip96, finalizeEvent, publishToPool, initializePool, publishAppHandler, getEvents } from "../lib/nostrClient";
import Link from "next/link";

export default function ProfilePage() {
  const { user, error, isLoading, refreshProfile } = useNostrAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsEditing_Saving] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState("posts"); // posts, replies, zaps
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [publishingHandler, setPublishingHandler] = useState(false);

  // Fetch user posts
  useEffect(() => {
    if (user && activeTab === "posts") {
      fetchUserPosts();
    }
  }, [user, activeTab]);

  const fetchUserPosts = async () => {
    if (!user?.pubkey) return;
    
    setLoadingPosts(true);
    try {
      const events = await getEvents({
        kinds: [1, 30023],
        authors: [user.pubkey],
        limit: 20,
      });
      setUserPosts(events || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-surface flex justify-center items-center pt-20">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
    
  if (error)
    return (
      <div className="min-h-screen bg-surface flex justify-center items-center pt-20">
        <div className="bg-error-container text-error px-6 py-4 rounded-xl border border-error/20">
          <p className="font-bold">{error}</p>
        </div>
      </div>
    );
    
  if (!user)
    return (
      <div className="min-h-screen bg-surface flex justify-center items-center pt-20">
        <div className="bg-surface-container-low px-8 py-6 rounded-2xl border border-outline-variant/20 text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-2">lock</span>
          <p className="text-primary font-bold mb-4">Please connect to Nostr</p>
          <p className="text-sm text-secondary">Connect your Nostr identity to view and manage your profile</p>
        </div>
      </div>
    );

  const handleEditClick = () => {
    setEditData({
      name: user.name || "",
      display_name: user.display_name || "",
      about: user.about || "",
      picture: user.picture || "",
      nip05: user.nip05 || "",
      lud16: user.lud16 || ""
    });
    setIsEditing(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFileNip96(file);
      if (result && result.url) {
        setEditData({ ...editData, picture: result.url });
      }
    } catch (err) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsEditing_Saving(true);
    try {
      const pool = await initializePool();
      const eventTemplate = {
        kind: 0,
        content: JSON.stringify(editData),
        tags: [],
        created_at: Math.floor(Date.now() / 1000)
      };

      let signedEvent;
      if (window.nostr) {
        signedEvent = await window.nostr.signEvent(eventTemplate);
      } else {
        const storedHexKey = localStorage.getItem("nostr_private_key");
        const privateKeyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privateKeyBytes[i] = parseInt(storedHexKey.substr(i * 2, 2), 16);
        }
        signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);
      }

      await publishToPool(pool, undefined, undefined, "", signedEvent);
      setIsEditing(false);
      refreshProfile();
    } catch (err) {
      alert("Failed to save profile: " + err.message);
    } finally {
      setIsEditing_Saving(false);
    }
  };

  const handlePublishHandler = async () => {
    setPublishingHandler(true);
    try {
      await publishAppHandler();
      alert("Successfully publicized Panstr as a Nostr App Handler!");
    } catch (err) {
      alert("Failed to publish app handler: " + err.message);
    } finally {
      setPublishingHandler(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Mock stats - in real implementation would fetch from Nostr
  const stats = {
    followers: "12.4k",
    following: "842",
    satsReceived: "1.2M",
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Main Content Area */}
      <main className="max-w-screen-2xl mx-auto px-4 md:px-12 py-8">
        
        {/* Profile Header */}
        <section className="relative mb-12">
          {/* Cover Image Area */}
          <div className="h-48 md:h-64 w-full rounded-2xl bg-surface-container-low overflow-hidden relative">
            <img 
              className="w-full h-full object-cover opacity-80" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnmHdSQ47f6pxIqa6TQk1dAD5LdzABABAQTC4gdFwCynKjCXdxER-1LuAhT6WYZxBMGfL_XndQesTk1N3C1Zvjeov_D83hrpahGCG5CGPUGxUmEj5kddkNI_gSK-JOJnVSRRPV7jNPM1El64r6rPd7Iojhcds--aWzq23laKDe1elF8od24c3MVW8DHUreOv7iINjN_MZx1cimONCaVWObCOaTI3fsyDdDdWhChPbFAXNLgAEsOLUJhw3O-Ql7u-BM6m2l4vfGask"
              alt="Profile cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/40 to-transparent"></div>
          </div>
          
          {/* Avatar & Identity */}
          <div className="absolute -bottom-16 left-4 md:left-8 flex flex-col md:flex-row md:items-end gap-6">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-surface bg-surface-container-lowest shadow-xl overflow-hidden">
                <img 
                  className="w-full h-full object-cover" 
                  src={isEditing ? editData.picture : (user.picture || `https://robohash.org/${user.pubkey}.png`)}
                  alt={user.display_name || user.name}
                  onError={(e) => {
                    e.target.src = `https://robohash.org/${user.pubkey}.png`;
                  }}
                />
              </div>
              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-black/40 text-white rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    {uploading ? <span className="loading loading-spinner loading-sm"></span> : "Change"}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </>
              )}
            </div>
            
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-on-surface tracking-tight">
                  {user.display_name || user.name}
                </h1>
                {user.nip05Verified && (
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                )}
                {isEditing && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="ml-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-container transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
              <p className="text-secondary font-mono text-sm opacity-70">
                {formatPubkey(user.pubkey, "npub")}
              </p>
              {user.name && user.display_name && user.name !== user.display_name && (
                <p className="text-tertiary font-bold text-sm mt-1">@{user.name}</p>
              )}
            </div>
          </div>
        </section>

        {/* Bio & Stats Grid */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {/* NIP-05 / Lightning */}
            {(user.nip05 || user.lud16) && (
              <div className="flex flex-wrap gap-2">
                {user.nip05 && (
                  <div className={`flex items-center gap-2 text-tertiary font-bold text-sm px-3 py-1 rounded-full w-fit border ${user.nip05Verified ? 'bg-tertiary-container/20 border-tertiary/30' : 'bg-surface-container-high border-outline-variant/30'}`}>
                    <span className="material-symbols-outlined text-sm">{user.nip05Verified ? 'verified' : 'alternate_email'}</span>
                    <span>{user.nip05}</span>
                  </div>
                )}
                {user.lud16 && (
                  <div className="flex items-center gap-2 text-tertiary font-bold text-sm bg-tertiary-container/10 px-3 py-1 rounded-full w-fit">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    <span>{user.lud16}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* About/Bio */}
            {user.about && (
              <p className="text-on-surface-variant leading-relaxed text-lg font-body">
                {user.about}
              </p>
            )}
            
            {/* Stats */}
            <div className="flex gap-6 pt-2">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-on-surface">{stats.followers}</span>
                <span className="text-xs uppercase tracking-widest text-secondary opacity-60">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-on-surface">{stats.following}</span>
                <span className="text-xs uppercase tracking-widest text-secondary opacity-60">Following</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-on-surface">{stats.satsReceived}</span>
                <span className="text-xs uppercase tracking-widest text-secondary opacity-60">Sats Received</span>
              </div>
            </div>

            {/* Edit Button (if not editing) */}
            {!isEditing && (
              <div className="pt-4">
                <button
                  onClick={handleEditClick}
                  className="px-6 py-3 bg-surface-container-high text-primary rounded-xl font-bold text-sm hover:bg-surface-container hover:shadow-md transition-all"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
          
          {/* Verified Identity Card */}
          <div className="bg-surface-container-low rounded-2xl p-6 h-fit space-y-4 border border-outline-variant/10">
            <h4 className="text-xs uppercase tracking-widest font-bold text-secondary">Verified Identity</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">NIP-05</span>
                <span className="text-on-surface font-medium">{user.nip05 || "Not verified"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Auth Method</span>
                <span className="text-on-surface font-medium">{user.authMethod === "extension" ? "Extension" : "Private Key"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Created</span>
                <span className="text-on-surface font-medium">Jan 2024</span>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Tabs */}
        <nav className="mt-12 mb-8 flex gap-8 border-b border-outline-variant/15">
          <button 
            onClick={() => setActiveTab("posts")}
            className={`pb-4 font-bold relative transition-all ${activeTab === "posts" ? "text-primary border-b-2 border-primary" : "text-secondary opacity-60 hover:opacity-100"}`}
          >
            Posts
            {userPosts.length > 0 && (
              <span className="absolute -top-1 -right-4 bg-tertiary-container text-on-tertiary-container text-[10px] px-1.5 rounded-full">{userPosts.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab("replies")}
            className={`pb-4 font-bold relative transition-all ${activeTab === "replies" ? "text-primary border-b-2 border-primary" : "text-secondary opacity-60 hover:opacity-100"}`}
          >
            Replies
          </button>
          <button 
            onClick={() => setActiveTab("zaps")}
            className={`pb-4 font-bold relative transition-all ${activeTab === "zaps" ? "text-primary border-b-2 border-primary" : "text-secondary opacity-60 hover:opacity-100"}`}
          >
            Zaps
          </button>
        </nav>

        {/* Thread Feed */}
        {activeTab === "posts" && (
          <div className="grid grid-cols-1 gap-6 pb-24">
            {loadingPosts ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : userPosts.length > 0 ? (
              userPosts.map((post) => (
                <article 
                  key={post.id} 
                  className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0px_12px_32px_rgba(24,25,51,0.06)] group hover:translate-y-[-2px] transition-all duration-300 border border-outline-variant/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 flex-wrap">
                      {post.tags?.filter(t => t[0] === 't').slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">
                          #{tag[1]}
                        </span>
                      ))}
                      <span className="bg-surface-container-high text-secondary px-3 py-1 rounded-full text-xs font-bold">
                        {formatTimeAgo(post.created_at)}
                      </span>
                    </div>
                    <button className="text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors leading-tight">
                    {post.content?.split('\n')[0]?.slice(0, 100) || "Untitled Post"}
                  </h2>
                  
                  <p className="text-on-surface-variant line-clamp-2 font-body mb-6">
                    {post.content?.slice(0, 200)}...
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                        <span className="text-xs font-bold">0</span>
                      </button>
                      <button className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">repeat</span>
                        <span className="text-xs font-bold">0</span>
                      </button>
                      <button className="flex items-center gap-2 text-tertiary hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        <span className="text-xs font-bold">0</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-6xl text-secondary/40 mb-4">post_add</span>
                <p className="text-on-surface-variant font-bold text-lg mb-2">No posts yet</p>
                <p className="text-secondary text-sm mb-6">Start sharing your thoughts with the community</p>
                <Link href="/_create" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined text-base">add</span>
                  Create Post
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "replies" && (
          <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-6xl text-secondary/40 mb-4">chat_bubble</span>
            <p className="text-on-surface-variant font-bold text-lg mb-2">No replies yet</p>
            <p className="text-secondary text-sm">Your replies will appear here</p>
          </div>
        )}

        {activeTab === "zaps" && (
          <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-6xl text-secondary/40 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <p className="text-on-surface-variant font-bold text-lg mb-2">No zaps yet</p>
            <p className="text-secondary text-sm">Zaps you receive will appear here</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-4 pb-safe lg:hidden bg-surface/80 backdrop-blur-md border-t border-outline-variant/20 z-50 shadow-[0px_-4px_20px_rgba(0,0,0,0.03)]">
        <Link href="/" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 transition-all">
          <span className="material-symbols-outlined">dynamic_feed</span>
          <span className="font-['Inter'] text-[10px] uppercase tracking-widest">Feed</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 transition-all">
          <span className="material-symbols-outlined">search</span>
          <span className="font-['Inter'] text-[10px] uppercase tracking-widest">Search</span>
        </Link>
        <Link href="/notifications" className="flex flex-col items-center justify-center text-secondary opacity-60 hover:opacity-100 transition-all">
          <span className="material-symbols-outlined">notifications</span>
          <span className="font-['Inter'] text-[10px] uppercase tracking-widest">Alerts</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center justify-center text-tertiary font-bold scale-110 transition-all">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <span className="font-['Inter'] text-[10px] uppercase tracking-widest">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
