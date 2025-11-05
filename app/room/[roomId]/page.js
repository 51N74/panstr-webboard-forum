'use client';

import RoomPage from '../../rooms/RoomPage';
import { useParams } from 'next/navigation';

export default function RoomPageRoute() {
  const params = useParams();
  return <RoomPage roomId={params.roomId} />;
}
