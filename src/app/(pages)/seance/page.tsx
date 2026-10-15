import { SeanceClient } from '@/app/features/seance';

// Static like `/`: the session reads exercises from the persisted React Query
// cache, so it opens instantly — no serverless boot on the way in.
export const dynamic = 'force-static';

export default function SeancePage() {
  return <SeanceClient />;
}
