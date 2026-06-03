// Supabase Edge Function — runs daily via pg_cron
// Expires unverified jobs and logs counts
//
// Schedule with pg_cron (SQL Editor):
//   select cron.schedule(
//     'expire-unverified-jobs',
//     '0 3 * * *',
//     $$ select net.http_post(
//         url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-expirations',
//         headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//       ) $$
//   );

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  // 1. Expire jobs whose 7-day window has passed
  const { data: expired, error: expireError } = await supabase
    .from("jobs")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("expires_at", now)
    .select("id, title, company_id");

  if (expireError) {
    return new Response(JSON.stringify({ error: expireError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Find jobs expiring in the next 24 hours (for warning emails)
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: dueSoon } = await supabase
    .from("jobs")
    .select("id, title, company_id")
    .eq("is_active", true)
    .lt("expires_at", in24h)
    .gte("expires_at", now);

  // 3. Find jobs expiring in the next 72 hours (for early warning emails)
  const in72h = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const { data: dueIn72h } = await supabase
    .from("jobs")
    .select("id, title, company_id")
    .eq("is_active", true)
    .lt("expires_at", in72h)
    .gte("expires_at", in24h);

  // Email sending: add your preferred provider here (Resend, SendGrid, etc.)
  // Example with Resend:
  //   const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
  //   for (const job of expired ?? []) {
  //     await fetch("https://api.resend.com/emails", {
  //       method: "POST",
  //       headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         from: "WorkQuest <noreply@workquest.co>",
  //         to: [job.company_email],
  //         subject: "🚫 Your listing has been hidden",
  //         html: `<p>Your listing "${job.title}" has been hidden because it wasn't verified within 7 days.</p>`,
  //       }),
  //     });
  //   }

  return new Response(
    JSON.stringify({
      timestamp: now,
      expired: expired?.length ?? 0,
      dueSoon: dueSoon?.length ?? 0,
      dueIn72h: dueIn72h?.length ?? 0,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
