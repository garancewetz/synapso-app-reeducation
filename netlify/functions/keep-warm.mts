// ⚡ COLD START: keep the Next.js server function warm.
//
// On Netlify every API route runs in a single server-handler Lambda. After a few
// idle minutes it is recycled, and the first launch of the day paid ~2s of boot
// before /api/auth/check could even answer (measured in prod). Pinging it every
// 5 min keeps one instance warm.
//
// The ping is cookie-less on purpose: /api/auth/check returns early without a
// session → no Prisma query, so Neon stays free to scale to zero (no compute cost).
//
// Scheduled functions only run on the published production deploy.
export default async () => {
  const siteUrl = process.env.URL;
  if (!siteUrl) return new Response('URL not set', { status: 500 });

  const startedAt = Date.now();
  try {
    const res = await fetch(`${siteUrl}/api/auth/check`, {
      headers: { 'user-agent': 'synapso-keep-warm' },
    });
    console.log(`keep-warm: ${res.status} in ${Date.now() - startedAt}ms`);
  } catch (error) {
    console.error('keep-warm failed', error);
  }
  return new Response('ok');
};

export const config = {
  schedule: '*/5 * * * *',
};
