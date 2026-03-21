"use client";

import RoomPage from "../../rooms/RoomPage";
import { useParams } from "next/navigation";
import { nip19Decode } from "../../lib/nostrClient";

export default function RoomPageRoute() {
  const params = useParams();
  let roomId = params.roomId;

  // Handle NIP-19 encoded identifiers (like naddr or nrelay)
  if (roomId.startsWith("n")) {
    try {
      const decoded = nip19Decode(roomId);
      if (decoded.type === "naddr") {
        roomId = decoded.data.identifier;
      } else if (decoded.type === "nrelay") {
        roomId = decoded.data;
      }
    } catch (e) {
      console.warn("Failed to decode NIP-19 roomId:", e);
    }
  }

  return <RoomPage roomId={roomId} />;
}
