// Supabase Edge Function — runs daily via pg_cron
// Expires unverified jobs and sends email notifications via Resend
//
// Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   — from resend.com (free tier: 3,000 emails/month)
//   APP_URL          — your deployed app URL (e.g. https://workquest.co)
//
// Schedule with pg_cron (SQL Editor):
//   select cron.schedule(
//     'expire-unverified-jobs', '0 3 * * *',
//     $$ select net.http_post(
//         url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-expirations',
//         headers := '{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//       ) $$
//   );

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL    = Deno.env.get("APP_URL") ?? "https://workquest.co";
const FROM       = "WorkQuest <noreply@workquest.co>";

// ── Email sending ─────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) return; // skip if not configured
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
}

// ── Email templates ───────────────────────────────────────────
function expiredTemplate(jobTitle: string, companyName: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:32px;">
    <div style="width:30px;height:30px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 12L8 4L13 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9L10.5 9" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <span style="font-weight:800;font-size:18px;color:#1e1b4b;">Work<span style="color:#6366f1;">Quest</span></span>
  </div>

  <div style="display:inline-flex;align-items:center;gap:6px;background:#fee2e2;border-radius:20px;padding:5px 12px;margin-bottom:14px;">
    <div style="width:7px;height:7px;border-radius:50%;background:#ef4444;"></div>
    <span style="font-size:11px;font-weight:700;color:#991b1b;">Currently hidden</span>
  </div>

  <h1 style="font-size:24px;font-weight:800;color:#1e1b4b;margin:0 0 6px;line-height:1.2;">Your listing has been hidden</h1>
  <p style="font-size:14px;color:#6366f1;font-weight:600;margin:0 0 14px;">${jobTitle} at ${companyName}</p>
  <p style="font-size:14px;color:#475569;line-height:1.75;margin:0 0 22px;">
    Because you didn't verify this listing within the 7-day window, it's been automatically hidden from WorkQuest's job board. Don't worry — it hasn't been deleted and your applicant data is safe.
  </p>

  <div style="text-align:center;margin-bottom:22px;">
    <a href="${APP_URL}" style="display:inline-block;background:#ef4444;color:#fff;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(239,68,68,0.35);">
      Re-verify &amp; Go Live Again →
    </a>
  </div>

  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:24px;">
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0;">
      Once you verify, your listing will be live again within minutes.
    </p>
  </div>

  <div style="text-align:center;padding-top:16px;border-top:1px solid #e2e8f0;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">WorkQuest · Keeping job boards honest since 2026</p>
  </div>
</div>
</body></html>`;
}

function warningTemplate(jobTitle: string, companyName: string, hoursLeft: number): string {
  const urgency  = hoursLeft <= 24;
  const badgeBg  = urgency ? "#fef3c7" : "#fffbeb";
  const badgeClr = urgency ? "#92400e" : "#b45309";
  const badgeDot = urgency ? "#f59e0b" : "#fbbf24";
  const badgeTxt = urgency ? `Expires in ~${Math.round(hoursLeft)} hours` : "Expires in ~3 days";
  const ctaClr   = urgency ? "#f59e0b" : "#6366f1";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:32px;">
    <div style="width:30px;height:30px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 12L8 4L13 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9L10.5 9" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <span style="font-weight:800;font-size:18px;color:#1e1b4b;">Work<span style="color:#6366f1;">Quest</span></span>
  </div>

  <div style="display:inline-flex;align-items:center;gap:6px;background:${badgeBg};border-radius:20px;padding:5px 12px;margin-bottom:14px;">
    <div style="width:7px;height:7px;border-radius:50%;background:${badgeDot};"></div>
    <span style="font-size:11px;font-weight:700;color:${badgeClr};">${badgeTxt}</span>
  </div>

  <h1 style="font-size:24px;font-weight:800;color:#1e1b4b;margin:0 0 6px;line-height:1.2;">
    ${urgency ? "Your listing is about to be hidden" : "Verification due soon"}
  </h1>
  <p style="font-size:14px;color:#6366f1;font-weight:600;margin:0 0 14px;">${jobTitle} at ${companyName}</p>
  <p style="font-size:14px;color:#475569;line-height:1.75;margin:0 0 22px;">
    Job seekers are actively browsing WorkQuest right now. To keep your listing visible and marked as <strong>Actively Recruiting</strong>, verify it's still open before the deadline.
  </p>

  <div style="text-align:center;margin-bottom:22px;">
    <a href="${APP_URL}" style="display:inline-block;background:${ctaClr};color:#fff;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px ${ctaClr}55;">
      Verify My Listing →
    </a>
  </div>

  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:24px;">
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0;">
      ${urgency
        ? "If you don't verify within the next few hours, your listing will be hidden from job seekers until you do."
        : "If you don't verify within 3 days, your listing will be hidden from job seekers until you do."}
    </p>
  </div>

  <div style="text-align:center;padding-top:16px;border-top:1px solid #e2e8f0;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">WorkQuest · Keeping job boards honest since 2026</p>
  </div>
</div>
</body></html>`;
}

// ── Main handler ──────────────────────────────────────────────
serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now   = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  // 1. Expire jobs whose 7-day window has passed
  const { data: expired, error: expireError } = await supabase
    .from("jobs")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("expires_at", now.toISOString())
    .select("id, title, company_id");

  if (expireError) {
    return new Response(JSON.stringify({ error: expireError.message }), { status: 500 });
  }

  // 2. Find jobs expiring in < 24 h (urgent warning)
  const { data: dueSoon } = await supabase
    .from("jobs")
    .select("id, title, company_id, expires_at")
    .eq("is_active", true)
    .lt("expires_at", in24h.toISOString())
    .gte("expires_at", now.toISOString());

  // 3. Find jobs expiring in 24–72 h (early warning)
  const { data: dueIn72h } = await supabase
    .from("jobs")
    .select("id, title, company_id, expires_at")
    .eq("is_active", true)
    .lt("expires_at", in72h.toISOString())
    .gte("expires_at", in24h.toISOString());

  // ── Send emails ───────────────────────────────────────────
  let emailsSent = 0;

  async function emailForJob(
    job: { id: string; title: string; company_id: string; expires_at?: string },
    type: "expired" | "warning",
  ) {
    // Get company name from companies table
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", job.company_id)
      .maybeSingle();

    // Get company email from auth.users (requires service role)
    const { data: userRecord } = await supabase.auth.admin.getUserById(job.company_id);
    const email = userRecord?.user?.email;
    if (!email) return;

    const companyName = company?.name ?? "Your company";

    if (type === "expired") {
      await sendEmail(
        email,
        `🚫 Your listing "${job.title}" is now hidden`,
        expiredTemplate(job.title, companyName),
      );
    } else {
      const hoursLeft = job.expires_at
        ? (new Date(job.expires_at).getTime() - now.getTime()) / 36e5
        : 24;
      await sendEmail(
        email,
        `⚠️ "${job.title}" expires in ${Math.round(hoursLeft)}h — verify now`,
        warningTemplate(job.title, companyName, hoursLeft),
      );
    }
    emailsSent++;
  }

  // Send in parallel (cap at 10 concurrent to avoid rate limits)
  const allTasks = [
    ...(expired   ?? []).map(j => () => emailForJob(j, "expired")),
    ...(dueSoon   ?? []).map(j => () => emailForJob(j, "warning")),
    ...(dueIn72h  ?? []).map(j => () => emailForJob(j, "warning")),
  ];

  for (let i = 0; i < allTasks.length; i += 10) {
    await Promise.all(allTasks.slice(i, i + 10).map(fn => fn()));
  }

  return new Response(
    JSON.stringify({
      timestamp:  now.toISOString(),
      expired:    expired?.length    ?? 0,
      dueSoon:    dueSoon?.length    ?? 0,
      dueIn72h:   dueIn72h?.length   ?? 0,
      emailsSent,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
