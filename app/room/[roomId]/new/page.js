'use client';

import CreateThreadPage from '../../../rooms/create/CreateThreadPage';
import { useParams } from 'next/navigation';

export default function CreateThreadPageRoute() {
  const params = useParams();
  return <CreateThreadPage roomId={params.roomId} />;
}
