"use client";

import React, { useState, useEffect } from "react";
import {
  getRelayList,
  createRelayListEvent,
  updateRelayList,
  testRelayHealth,
  monitorRelayHealth,
  getOptimalRelays,
  discoverRelaysFromNetwork,
  scoreRelays,
  getRelayStatistics,
  getAllRelays,
  addCustomRelay,
  removeCustomRelay,
} from "../../../lib/nostrClient";

const RelayManagement = ({ currentPubkey, privateKey }) => {
  const [activeTab, setActiveTab] = useState("health");
  const [relayList, setRelayList] = useState({ read: [], write: [], both: [] });
  const [healthResults, setHealthResults] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [discoveredRelays, setDiscoveredRelays] = useState([]);
  const [optimalRelays, setOptimalRelays] = useState({
    read: [],
    write: [],
    both: [],
  });
  const [editingList, setEditingList] = useState(false);
  const [newRelays, setNewRelays] = useState({ read: [], write: [], both: [] });
  const [customRelay, setCustomRelay] = useState("");
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (currentPubkey) {
      loadRelayData();
    }
  }, [currentPubkey]);

  const loadRelayData = async () => {
    try {
      setLoading((prev) => ({ ...prev, relayList: true }));

      // Load user's relay list
      const list = await getRelayList(currentPubkey);
      setRelayList(list);
      setNewRelays({ read: list.read, write: list.write, both: list.both });

      // Load optimal relays
      const readRelays = await getOptimalRelays(currentPubkey, "read");
      const writeRelays = await getOptimalRelays(currentPubkey, "write");
      setOptimalRelays({
        read: readRelays,
        write: writeRelays,
        both: [...new Set([...readRelays, ...writeRelays])],
      });
    } catch (error) {
      console.error("Error loading relay data:", error);
    } finally {
      setLoading((prev) => ({ ...prev, relayList: false }));
    }
  };

  const testRelayHealth = async () => {
    try {
      setLoading((prev) => ({ ...prev, health: true }));
      const allRelays = getAllRelays();
      const results = await monitorRelayHealth(allRelays);
      const scored = scoreRelays(results);
      setHealthResults(scored);
    } catch (error) {
      console.error("Error testing relay health:", error);
    } finally {
      setLoading((prev) => ({ ...prev, health: false }));
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading((prev) => ({ ...prev, statistics: true }));
      const stats = await getRelayStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading((prev) => ({ ...prev, statistics: false }));
    }
  };

  const discoverNetworkRelays = async () => {
    try {
      setLoading((prev) => ({ ...prev, discovery: true }));
      const relays = await discoverRelaysFromNetwork(currentPubkey);
      setDiscoveredRelays(relays);
    } catch (error) {
      console.error("Error discovering relays:", error);
    } finally {
      setLoading((prev) => ({ ...prev, discovery: false }));
    }
  };

  const saveRelayList = async () => {
    try {
      setLoading((prev) => ({ ...prev, save: true }));
      await updateRelayList(
        currentPubkey,
        privateKey,
        newRelays.read,
        newRelays.write,
        newRelays.both,
      );
      setEditingList(false);
      await loadRelayData();
    } catch (error) {
      console.error("Error saving relay list:", error);
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const addCustomRelayHandler = async () => {
    if (!customRelay.trim()) return;

    try {
      setLoading((prev) => ({ ...prev, custom: true }));
      await addCustomRelay(customRelay);
      setCustomRelay("");
      await testRelayHealth();
    } catch (error) {
      console.error("Error adding custom relay:", error);
    } finally {
      setLoading((prev) => ({ ...prev, custom: false }));
    }
  };

  const removeCustomRelayHandler = async (relayUrl) => {
    try {
      await removeCustomRelay(relayUrl);
      await testRelayHealth();
    } catch (error) {
      console.error("Error removing custom relay:", error);
    }
  };

  const formatLatency = (latency) => {
    if (!latency) return "N/A";
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(2)}s`;
  };

  const getHealthBadge = (result) => {
    if (!result.connected) {
      return (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
          Offline
        </span>
      );
    }

    if (result.latency < 500) {
      return (
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
          Excellent
        </span>
      );
    } else if (result.latency < 1000) {
      return (
        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
          Good
        </span>
      );
    } else {
      return (
        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
          Slow
        </span>
      );
    }
  };

  return (
    <div className="relay-management bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Enhanced Relay Management (NIP-65)
        </h2>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b">
          {["health", "list", "discovery", "statistics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Health Monitoring Tab */}
      {activeTab === "health" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Relay Health Monitoring
            </h3>
            <button
              onClick={testRelayHealth}
              disabled={loading.health}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
            >
              {loading.health ? "Testing..." : "Test All Relays"}
            </button>
          </div>

          {healthResults.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Relay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Latency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Supported Kinds
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {healthResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate">{result.url}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getHealthBadge(result)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLatency(result.latency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {result.score}/100
                          </div>
                          <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {result.supportedKinds.slice(0, 3).map((kind) => (
                            <span
                              key={kind}
                              className="bg-gray-100 px-2 py-1 rounded text-xs"
                            >
                              {kind}
                            </span>
                          ))}
                          {result.supportedKinds.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{result.supportedKinds.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getAllRelays().includes(result.url) ? (
                          <button
                            onClick={() => removeCustomRelayHandler(result.url)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => addCustomRelay(result.url)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Add
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Relay List Tab */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Relay List (NIP-65)
            </h3>
            <div className="space-x-2">
              {editingList ? (
                <>
                  <button
                    onClick={() => setEditingList(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRelayList}
                    disabled={loading.save}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                  >
                    {loading.save ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingList(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit List
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Read Relays */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Read Relays</h4>
              {editingList ? (
                <textarea
                  value={newRelays.read.join("\n")}
                  onChange={(e) =>
                    setNewRelays({
                      ...newRelays,
                      read: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="wss://relay1.example.com&#10;wss://relay2.example.com"
                />
              ) : (
                <div className="space-y-1">
                  {relayList.read.length > 0 ? (
                    relayList.read.map((relay) => (
                      <div
                        key={relay}
                        className="text-sm text-gray-600 truncate"
                      >
                        {relay}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400">
                      No read relays configured
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Write Relays */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Write Relays</h4>
              {editingList ? (
                <textarea
                  value={newRelays.write.join("\n")}
                  onChange={(e) =>
                    setNewRelays({
                      ...newRelays,
                      write: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="wss://relay1.example.com&#10;wss://relay2.example.com"
                />
              ) : (
                <div className="space-y-1">
                  {relayList.write.length > 0 ? (
                    relayList.write.map((relay) => (
                      <div
                        key={relay}
                        className="text-sm text-gray-600 truncate"
                      >
                        {relay}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400">
                      No write relays configured
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Both Relays */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Both (Read & Write)
              </h4>
              {editingList ? (
                <textarea
                  value={newRelays.both.join("\n")}
                  onChange={(e) =>
                    setNewRelays({
                      ...newRelays,
                      both: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="wss://relay1.example.com&#10;wss://relay2.example.com"
                />
              ) : (
                <div className="space-y-1">
                  {relayList.both.length > 0 ? (
                    relayList.both.map((relay) => (
                      <div
                        key={relay}
                        className="text-sm text-gray-600 truncate"
                      >
                        {relay}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400">
                      No both relays configured
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Optimal Relays */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-medium text-gray-900 mb-3">
              Optimal Relays for You
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Best Read:</span>
                <div className="text-gray-600 mt-1">
                  {optimalRelays.read.length > 0
                    ? optimalRelays.read.slice(0, 3).join(", ")
                    : "None"}
                </div>
              </div>
              <div>
                <span className="font-medium">Best Write:</span>
                <div className="text-gray-600 mt-1">
                  {optimalRelays.write.length > 0
                    ? optimalRelays.write.slice(0, 3).join(", ")
                    : "None"}
                </div>
              </div>
              <div>
                <span className="font-medium">Overall Best:</span>
                <div className="text-gray-600 mt-1">
                  {optimalRelays.both.length > 0
                    ? optimalRelays.both.slice(0, 3).join(", ")
                    : "None"}
                </div>
              </div>
            </div>
          </div>

          {/* Add Custom Relay */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Add Custom Relay</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customRelay}
                onChange={(e) => setCustomRelay(e.target.value)}
                placeholder="wss://your-relay.example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={addCustomRelayHandler}
                disabled={loading.custom || !customRelay.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
              >
                {loading.custom ? "Adding..." : "Add Relay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Tab */}
      {activeTab === "discovery" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Network Relay Discovery
            </h3>
            <button
              onClick={discoverNetworkRelays}
              disabled={loading.discovery}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
            >
              {loading.discovery ? "Discovering..." : "Discover from Network"}
            </button>
          </div>

          {discoveredRelays.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Found {discoveredRelays.length} relays from your network
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {discoveredRelays.map((relay) => (
                  <div
                    key={relay}
                    className="border rounded p-2 text-sm text-gray-700 truncate"
                  >
                    {relay}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === "statistics" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Relay Statistics
            </h3>
            <button
              onClick={loadStatistics}
              disabled={loading.statistics}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
            >
              {loading.statistics ? "Loading..." : "Load Statistics"}
            </button>
          </div>

          {statistics && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {statistics.total}
                </div>
                <div className="text-sm text-gray-600">Total Relays</div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.connected}
                </div>
                <div className="text-sm text-gray-600">Connected</div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {formatLatency(statistics.averageLatency)}
                </div>
                <div className="text-sm text-gray-600">Average Latency</div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics.supportedKinds.length}
                </div>
                <div className="text-sm text-gray-600">Supported Kinds</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RelayManagement;
