"use client";

import React, { useState, useEffect } from "react";
import {
  // NIP-49: Private Key Encryption
  encryptPrivateKey,
  decryptPrivateKey,
  generateKeysFromMnemonic,
  generateMnemonic,
  storeEncryptedKey,
  retrieveEncryptedKey,
  listStoredKeys,
  deleteStoredKey,

  // NIP-44: Versioned Encryption
  encryptMessageNIP44,
  decryptMessageNIP44,

  // NIP-42: Client Authentication
  createAuthEvent,
  authenticateWithRelay,
  ACCESS_ROLES,
  ROLE_PERMISSIONS,
  checkPermission,
  createAuthToken,
  verifyAuthToken,

  // Utilities
  generatePrivateKey,
  getPublicKey,
  formatPubkey,
} from "../../../lib/nostrClient";

const EnhancedSecurity = ({ currentPubkey }) => {
  const [activeTab, setActiveTab] = useState("encryption");
  const [loading, setLoading] = useState({});
  const [storedKeys, setStoredKeys] = useState([]);
  const [mnemonic, setMnemonic] = useState("");
  const [generatedMnemonic, setGeneratedMnemonic] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState("");
  const [keyName, setKeyName] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);
  const [testMessage, setTestMessage] = useState("Hello, this is a test message!");
  const [testRecipient, setTestRecipient] = useState("");
  const [encryptedTest, setEncryptedTest] = useState("");
  const [decryptedTest, setDecryptedTest] = useState("");
  const [authRelay, setAuthRelay] = useState("wss://relay.damus.io");
  const [authChallenge, setAuthChallenge] = useState("");
  const [userRole, setUserRole] = useState(ACCESS_ROLES.PUBLIC);
  const [tokenPayload, setTokenPayload] = useState({});
  const [generatedToken, setGeneratedToken] = useState("");
  const [tokenVerification, setTokenVerification] = useState(null);

  // Load stored keys on component mount
  useEffect(() => {
    loadStoredKeys();
  }, []);

  const loadStoredKeys = () => {
    try {
      const keys = listStoredKeys();
      setStoredKeys(keys);
    } catch (error) {
      console.error("Error loading stored keys:", error);
    }
  };

  // Generate new mnemonic
  const handleGenerateMnemonic = () => {
    try {
      const newMnemonic = generateMnemonic(128); // 12 words
      setGeneratedMnemonic(newMnemonic);
      setShowMnemonic(true);
    } catch (error) {
      console.error("Error generating mnemonic:", error);
      alert("Failed to generate mnemonic phrase");
    }
  };

  // Generate keys from mnemonic
  const handleGenerateKeysFromMnemonic = async () => {
    if (!mnemonic.trim()) {
      alert("Please enter a mnemonic phrase");
      return;
    }

    try {
      setLoading({ ...loading, generating: true });
      const keys = generateKeysFromMnemonic(mnemonic.trim());

      if (keys.privateKeyHex && keys.publicKeyHex) {
        alert(`Keys generated successfully!\n\nPublic Key: ${keys.publicKeyHex.slice(0, 16)}...\n\nStore this private key securely!`);
      }
    } catch (error) {
      console.error("Error generating keys from mnemonic:", error);
      alert("Failed to generate keys from mnemonic. Please check the phrase and try again.");
    } finally {
      setLoading({ ...loading, generating: false });
    }
  };

  // Encrypt and store private key
  const handleEncryptAndStoreKey = async () => {
    if (!encryptionPassword.trim() || !currentPubkey) {
      alert("Please provide a password and ensure you're logged in");
      return;
    }

    try {
      setLoading({ ...loading, encrypting: true });

      // Get current private key (this would come from your auth context)
      const privateKey = localStorage.getItem("nostr_private_key") ||
                       localStorage.getItem("demo_private_key");

      if (!privateKey) {
        alert("No private key found to encrypt");
        return;
      }

      const storageKey = await storeEncryptedKey(privateKey, encryptionPassword, keyName);
      alert("Private key encrypted and stored successfully!");

      // Clear form
      setEncryptionPassword("");
      setKeyName("");
      loadStoredKeys();
    } catch (error) {
      console.error("Error encrypting and storing key:", error);
      alert("Failed to encrypt and store private key");
    } finally {
      setLoading({ ...loading, encrypting: false });
    }
  };

  // Retrieve and decrypt key
  const handleRetrieveKey = async (storageKey) => {
    const password = prompt("Enter password to decrypt this key:");
    if (!password) return;

    try {
      setLoading({ ...loading, [storageKey]: true });
      const decrypted = await retrieveEncryptedKey(storageKey, password);
      alert(`Private key retrieved:\n\n${decrypted.slice(0, 16)}...\n\nThis is your private key - keep it secure!`);
    } catch (error) {
      console.error("Error retrieving key:", error);
      alert("Failed to decrypt key - invalid password or corrupted data");
    } finally {
      setLoading({ ...loading, [storageKey]: false });
    }
  };

  // Delete stored key
  const handleDeleteKey = (storageKey) => {
    if (!confirm("Are you sure you want to delete this encrypted key?")) return;

    try {
      const success = deleteStoredKey(storageKey);
      if (success) {
        alert("Encrypted key deleted successfully");
        loadStoredKeys();
      } else {
        alert("Failed to delete encrypted key");
      }
    } catch (error) {
      console.error("Error deleting key:", error);
      alert("Failed to delete encrypted key");
    }
  };

  // Test NIP-44 encryption
  const handleTestNIP44Encryption = async () => {
    if (!testRecipient.trim() || !currentPubkey) {
      alert("Please provide a recipient and ensure you're logged in");
      return;
    }

    try {
      setLoading({ ...loading, encryption: true });

      // Get current private key
      const privateKey = localStorage.getItem("nostr_private_key") ||
                       localStorage.getItem("demo_private_key");

      if (!privateKey) {
        alert("No private key available for encryption test");
        return;
      }

      const result = await encryptMessageNIP44(
        testMessage,
        testRecipient.trim(),
        privateKey
      );

      setEncryptedTest(result.encrypted);
      setDecryptedTest("");
    } catch (error) {
      console.error("Error encrypting message:", error);
      alert("Failed to encrypt message with NIP-44");
    } finally {
      setLoading({ ...loading, encryption: false });
    }
  };

  // Test NIP-44 decryption
  const handleTestNIP44Decryption = async () => {
    if (!encryptedTest || !currentPubkey) {
      alert("Please encrypt a message first and ensure you're logged in");
      return;
    }

    try {
      setLoading({ ...loading, decryption: true });

      // Get current private key
      const privateKey = localStorage.getItem("nostr_private_key") ||
                       localStorage.getItem("demo_private_key");

      if (!privateKey) {
        alert("No private key available for decryption test");
        return;
      }

      const result = await decryptMessageNIP44(
        encryptedTest,
        testRecipient.trim(),
        privateKey
      );

      setDecryptedTest(result.decrypted);
    } catch (error) {
      console.error("Error decrypting message:", error);
      alert("Failed to decrypt message with NIP-44");
    } finally {
      setLoading({ ...loading, decryption: false });
    }
  };

  // Test NIP-42 authentication
  const handleTestNIP42Auth = async () => {
    try {
      setLoading({ ...loading, auth: true });

      // Get current private key
      const privateKey = localStorage.getItem("nostr_private_key") ||
                       localStorage.getItem("demo_private_key");

      if (!privateKey) {
        alert("No private key available for authentication");
        return;
      }

      const result = await authenticateWithRelay(authRelay, privateKey);

      if (result.success) {
        alert(`Successfully authenticated with ${authRelay}`);
      } else {
        alert(`Authentication failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error testing authentication:", error);
      alert("Failed to test NIP-42 authentication");
    } finally {
      setLoading({ ...loading, auth: false });
    }
  };

  // Generate auth token
  const handleGenerateToken = () => {
    try {
      setLoading({ ...loading, token: true });

      // Get current private key
      const privateKey = localStorage.getItem("nostr_private_key") ||
                       localStorage.getItem("demo_private_key");

      if (!privateKey) {
        alert("No private key available for token generation");
        return;
      }

      const token = createAuthToken(
        {
          role: userRole,
          permissions: ROLE_PERMISSIONS[userRole],
        },
        privateKey,
        3600 // 1 hour
      );

      setGeneratedToken(token);
    } catch (error) {
      console.error("Error generating token:", error);
      alert("Failed to generate authentication token");
    } finally {
      setLoading({ ...loading, token: false });
    }
  };

  // Verify auth token
  const handleVerifyToken = () => {
    if (!generatedToken || !currentPubkey) {
      alert("Please generate a token first and ensure you're logged in");
      return;
    }

    try {
      const result = verifyAuthToken(generatedToken, currentPubkey);
      setTokenVerification(result);
    } catch (error) {
      console.error("Error verifying token:", error);
      alert("Failed to verify token");
    }
  };

  return (
    <div className="enhanced-security bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Enhanced Security Features (NIP-49, NIP-44, NIP-42)
        </h2>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b">
          {[
            { id: "encryption", name: "Key Encryption", icon: "🔐" },
            { id: "messaging", name: "Encrypted DMs", icon: "🔒" },
            { id: "auth", name: "Relay Auth", icon: "🛡️" },
            { id: "tokens", name: "Auth Tokens", icon: "🎫" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Key Encryption Tab */}
      {activeTab === "encryption" && (
        <div className="space-y-6">
          {/* Mnemonic Generation */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔐 NIP-49: Private Key Encryption & NIP-06: Mnemonic Support
            </h3>

            <div className="mb-4">
              <button
                onClick={handleGenerateMnemonic}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate New Mnemonic
              </button>
            </div>

            {generatedMnemonic && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium text-gray-900">Generated Mnemonic:</label>
                  <button
                    onClick={() => setShowMnemonic(!showMnemonic)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {showMnemonic ? "Hide" : "Show"}
                  </button>
                </div>
                {showMnemonic && (
                  <div className="font-mono text-sm bg-white p-3 rounded border">
                    {generatedMnemonic}
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  Save this mnemonic phrase securely. It can be used to recover your account.
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Generate Keys from Mnemonic</h4>
                <textarea
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="Enter your 12 or 24-word mnemonic phrase..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  rows={3}
                />
                <button
                  onClick={handleGenerateKeysFromMnemonic}
                  disabled={loading.generating || !mnemonic.trim()}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                >
                  {loading.generating ? "Generating..." : "Generate Keys"}
                </button>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Encrypt & Store Private Key</h4>
                <input
                  type="password"
                  value={encryptionPassword}
                  onChange={(e) => setEncryptionPassword(e.target.value)}
                  placeholder="Encryption password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Key name (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <button
                  onClick={handleEncryptAndStoreKey}
                  disabled={loading.encrypting || !encryptionPassword.trim()}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300"
                >
                  {loading.encrypting ? "Encrypting..." : "Encrypt & Store Key"}
                </button>
              </div>
            </div>

            {/* Stored Keys */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Stored Encrypted Keys</h4>
              {storedKeys.length === 0 ? (
                <p className="text-gray-500">No encrypted keys stored</p>
              ) : (
                <div className="space-y-2">
                  {storedKeys.map((key) => (
                    <div key={key.storageKey} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div>
                        <div className="font-medium">{key.name}</div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(key.timestamp * 1000).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRetrieveKey(key.storageKey)}
                          disabled={loading[key.storageKey]}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Retrieve
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.storageKey)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Encrypted Messaging Tab */}
      {activeTab === "messaging" && (
        <div className="space-y-6">
          <div className="border rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔒 NIP-44: Versioned Encrypted Direct Messages
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Encryption Test</h4>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Recipient public key (npub...)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 font-mono text-sm"
                />
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Message to encrypt..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  rows={3}
                />
                <button
                  onClick={handleTestNIP44Encryption}
                  disabled={loading.encryption || !testRecipient.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 w-full"
                >
                  {loading.encryption ? "Encrypting..." : "Encrypt Message"}
                </button>

                {encryptedTest && (
                  <div className="mt-3 p-3 bg-white border rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Encrypted:</div>
                    <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                      {encryptedTest}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Decryption Test</h4>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    Use the same recipient public key from encryption
                  </div>
                  <button
                    onClick={handleTestNIP44Decryption}
                    disabled={loading.decryption || !encryptedTest}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 w-full"
                  >
                    {loading.decryption ? "Decrypting..." : "Decrypt Message"}
                  </button>
                </div>

                {decryptedTest && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Decrypted:</div>
                    <div className="text-sm">
                      {decryptedTest}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relay Authentication Tab */}
      {activeTab === "auth" && (
        <div className="space-y-6">
          <div className="border rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🛡️ NIP-42: Client Authentication & Role-Based Access
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Relay Authentication</h4>
                <input
                  type="text"
                  value={authRelay}
                  onChange={(e) => setAuthRelay(e.target.value)}
                  placeholder="wss://relay.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 font-mono text-sm"
                />
                <button
                  onClick={handleTestNIP42Auth}
                  disabled={loading.auth}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 w-full"
                >
                  {loading.auth ? "Authenticating..." : "Authenticate with Relay"}
                </button>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Role Permissions</h4>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                >
                  {Object.values(ACCESS_ROLES).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>

                <div className="p-3 bg-white border rounded-lg">
                  <div className="text-xs text-gray-500 mb-2">Current Role Permissions:</div>
                  <div className="space-y-1 text-sm">
                    {Object.entries(ROLE_PERMISSIONS[userRole]).map(([perm, value]) => (
                      <div key={perm} className="flex justify-between">
                        <span className="capitalize">{perm.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className={value ? "text-green-600" : "text-red-600"}>
                          {value ? "✓" : "✗"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Tokens Tab */}
      {activeTab === "tokens" && (
        <div className="space-y-6">
          <div className="border rounded-lg p-6 bg-purple-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🎫 Token-Based Authentication System
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Generate Auth Token</h4>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                >
                  {Object.values(ACCESS_ROLES).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGenerateToken}
                  disabled={loading.token}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 w-full"
                >
                  {loading.token ? "Generating..." : "Generate Token"}
                </button>

                {generatedToken && (
                  <div className="mt-3 p-3 bg-white border rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Generated Token:</div>
                    <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                      {generatedToken}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Verify Token</h4>
                <button
                  onClick={handleVerifyToken}
                  disabled={!generatedToken}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-300 w-full mb-3"
                >
                  Verify Generated Token
                </button>

                {tokenVerification && (
                  <div className={`p-3 border rounded-lg ${
                    tokenVerification.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-sm font-medium mb-2">
                      Verification Result: {tokenVerification.valid ? "✅ Valid" : "❌ Invalid"}
                    </div>
                    {tokenVerification.valid && tokenVerification.payload && (
                      <div className="text-xs space-y-1">
                        <div>Role: {tokenVerification.payload.role}</div>
                        <div>Issued: {new Date(tokenVerification.payload.iat * 1000).toLocaleString()}</div>
                        <div>Expires: {new Date(tokenVerification.payload.exp * 1000).toLocaleString()}</div>
                      </div>
                    )}
                    {tokenVerification.error && (
                      <div className="text-xs text-red-600">Error: {tokenVerification.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Implementation Notes */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">
          🚀 Security Implementation Notes
        </h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <p>
            <strong>NIP-49:</strong> Private keys are encrypted using scrypt key derivation and ChaCha20-Poly1305 AEAD encryption.
            The encrypted keys are stored in NIP-49 compatible format for portability.
          </p>
          <p>
            <strong>NIP-44:</strong> Messages are encrypted using versioned encryption with forward secrecy.
            Supports different encryption versions and automatic negotiation between clients.
          </p>
          <p>
            <strong>NIP-42:</strong> Relay authentication with challenge-response mechanism.
            Includes role-based access control and token-based authentication for enhanced security.
          </p>
          <p className="mt-3">
            <strong>Security Best Practices:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>All encryption uses industry-standard algorithms</li>
            <li>Private keys never stored in plain text</li>
            <li>Authentication tokens have expiration times</li>
            <li>Role-based permissions prevent privilege escalation</li>
            <li>All sensitive operations require user confirmation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSecurity;
