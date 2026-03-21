"use client";

import { useState, useRef } from "react";
import { useNostrAuth } from "../context/NostrAuthContext";
import { formatPubkey, uploadFileNip96, finalizeEvent, publishToPool, initializePool, publishAppHandler } from "../lib/nostrClient";
import Link from "next/link";

export default function ProfilePage() {
  const { user, error, isLoading, refreshProfile } = useNostrAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsEditing_Saving] = useState(false);
  const [editData, setEditData] = useState({});
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [publishingHandler, setPublishingHandler] = useState(false);

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-blue-600"></div>
      </div>
    );
  if (error)
    return (
      <div className="alert alert-error max-w-md mx-auto mt-8">
        <span>{error}</span>
      </div>
    );
  if (!user)
    return (
      <div className="alert alert-warning max-w-md mx-auto mt-8 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span>Please connect to Nostr to view your profile</span>
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

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 lg:p-12 max-w-7xl mx-auto animate-fade-in">
      {/* Profile Card */}
      <div className="flex-1 lg:flex-initial lg:w-96">
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <div className="flex flex-col items-center">
            <div className="avatar mb-6 relative group">
              <div className="w-32 h-32 rounded-full ring-4 ring-blue-50 ring-offset-base-100 shadow-inner overflow-hidden">
                <img
                  src={isEditing ? editData.picture : user.picture}
                  alt={user.display_name || user.name}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.src = `https://robohash.org/${user.pubkey}.png`;
                  }}
                />
              </div>
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploading ? <span className="loading loading-spinner loading-sm"></span> : "Change"}
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            <div className="text-center mb-6 w-full">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.display_name || user.name}
              </h1>
              {user.name && user.display_name && user.name !== user.display_name && (
                <p className="text-blue-600 font-medium mt-1">@{user.name}</p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 py-2 rounded-lg font-mono">
                  {formatPubkey(user.pubkey, "npub")}
                </div>

                {user.nip05Verified && (
                  <div className="flex items-center justify-center gap-1 text-sm text-green-600 font-bold bg-green-50 py-1 rounded-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified via {user.nip05}
                  </div>
                )}
              </div>
            </div>

            {user.about && (
              <div className="w-full mb-6 italic text-gray-600 text-center leading-relaxed">
                "{user.about}"
              </div>
            )}

            <div className="w-full space-y-3">
              {!isEditing ? (
                <button 
                  onClick={handleEditClick}
                  className="btn btn-primary w-full shadow-lg shadow-blue-100"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="btn btn-success flex-1"
                  >
                    {isSaving ? <span className="loading loading-spinner loading-sm"></span> : "Save"}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={refreshProfile}
                className="btn btn-outline w-full"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-8">
        {isEditing && (
          <div className="bg-white shadow-xl rounded-2xl p-8 border border-blue-100 animate-slide-up">
            <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Profile Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label"><span className="label-text font-bold">Display Name</span></label>
                <input 
                  type="text" 
                  className="input input-bordered focus:border-blue-500" 
                  value={editData.display_name}
                  onChange={e => setEditData({...editData, display_name: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-bold">Username (@)</span></label>
                <input 
                  type="text" 
                  className="input input-bordered focus:border-blue-500" 
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                />
              </div>
              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text font-bold">About</span></label>
                <textarea 
                  className="textarea textarea-bordered h-24 focus:border-blue-500" 
                  value={editData.about}
                  onChange={e => setEditData({...editData, about: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-bold">NIP-05 Identifier</span></label>
                <input 
                  type="text" 
                  className="input input-bordered focus:border-blue-500" 
                  value={editData.nip05}
                  onChange={e => setEditData({...editData, nip05: e.target.value})}
                  placeholder="user@domain.com"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-bold">Lightning Address (LU16)</span></label>
                <input 
                  type="text" 
                  className="input input-bordered focus:border-blue-500" 
                  value={editData.lud16}
                  onChange={e => setEditData({...editData, lud16: e.target.value})}
                  placeholder="bolt@pay.address"
                />
              </div>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.605 7.09a3.323 3.323 0 00-4.738 0 3.323 3.323 0 000 4.738 3.323 3.323 0 004.738 0 3.323 3.323 0 000-4.738z" /></svg>
            Account Details
          </h2>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Auth Method</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {user.authMethod === "extension" ? "🚀 Browser Extension" : "🔑 Private Key"}
                </p>
              </div>
              <span className={`badge ${user.authMethod === "extension" ? "badge-success" : "badge-info"} badge-lg`}>
                Connected
              </span>
            </div>

            <div>
              <label className="label"><span className="label-text font-bold text-gray-500">Public Key (HEX)</span></label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user.pubkey}
                  readOnly
                  className="input input-bordered w-full font-mono text-sm bg-gray-50"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.pubkey);
                    alert("Copied!");
                  }}
                  className="btn btn-square btn-ghost hover:bg-blue-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Discovery</h3>
              <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-blue-900">Publicize Panstr</p>
                  <p className="text-xs text-blue-700 mt-1">Announce Panstr as a handler for Threads and Communities so other apps can discover it (NIP-89).</p>
                </div>
                <button 
                  onClick={handlePublishHandler}
                  disabled={publishingHandler}
                  className="btn btn-primary btn-sm whitespace-nowrap"
                >
                  {publishingHandler ? <span className="loading loading-spinner loading-xs"></span> : "Publicize"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Your Posts</h2>
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-lg">Activity feed coming soon...</p>
            <Link href="/" className="btn btn-primary btn-sm mt-6">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
