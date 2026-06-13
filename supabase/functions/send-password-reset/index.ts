// Edge Function: send-password-reset
// Generates a Supabase password recovery link via admin API and emails it to
// the user's notification_email (personal Gmail etc.) instead of the BUBT email,
// which Supabase's SMTP cannot reliably reach.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};

// Always return HTTP 200 — supabase.functions.invoke() puts non-2xx responses
// into error.context (not data), making body inaccessible without extra async parsing.
// We signal failures via { error: "..." } in the JSON body instead.
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { bubtEmail, redirectTo } = await req.json() as { bubtEmail: string; redirectTo: string };

    if (!bubtEmail?.endsWith("@cse.bubt.edu.bd")) {
      return json({ error: "Must be a @cse.bubt.edu.bd email." });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Look up the user's notification_email and name
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("notification_email, name")
      .eq("bubt_email", bubtEmail.trim().toLowerCase())
      .maybeSingle();

    if (profileErr || !profile) {
      return json({ error: "No account found for that email." });
    }

    const rawNotificationEmail = (profile.notification_email as string | null)?.trim() ?? null;
    const bubtNorm = bubtEmail.trim().toLowerCase();

    // Treat blank or same-as-BUBT notification_email as unset
    const recipientEmail =
      rawNotificationEmail &&
      rawNotificationEmail.length > 0 &&
      rawNotificationEmail.toLowerCase() !== bubtNorm &&
      !rawNotificationEmail.toLowerCase().endsWith("@cse.bubt.edu.bd")
        ? rawNotificationEmail
        : null;

    if (!recipientEmail) {
      return json({
        error:
          "No personal email found in your profile. Please sign in, go to Profile → Edit, " +
          "add your Gmail or personal email under 'Notification Email', then try again.",
      });
    }

    console.log(`Sending password reset for ${bubtNorm} → ${recipientEmail}`);

    // Generate the recovery link without sending any email
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: bubtEmail.trim().toLowerCase(),
      options: { redirectTo: redirectTo ?? Deno.env.get("SUPABASE_URL") },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("generateLink error:", linkErr);
      return json({ error: linkErr?.message ?? "Could not generate reset link." });
    }

    const resetLink = linkData.properties.action_link;
    // Skip common Bangladeshi honorific prefixes so "Md. Miftahur" → "Miftahur"
    const HONORIFICS = new Set(["md.", "md", "mohammad", "mr.", "mr", "mrs.", "mrs", "dr.", "dr", "sheikh", "sk."]);
    const nameParts = ((profile.name as string | null) ?? "").trim().split(/\s+/);
    const firstName = nameParts.find((p) => !HONORIFICS.has(p.toLowerCase())) ?? nameParts[0] ?? "Student";

    // Send via Resend. Requires a verified sending domain — onboarding@resend.dev
    // only delivers to the Resend account owner's email. Once a domain is verified,
    // update the `from` field below to `noreply@yourdomain.com`.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return json({ error: "Email service not configured (RESEND_API_KEY missing)." });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Edu51Portal <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: "Reset your Edu51Portal password",
        html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header with logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:28px 32px;text-align:center">
            <img src="https://edu51five.vercel.app/Edu_51_Logo.png"
                 alt="Edu51Portal"
                 width="56" height="56"
                 style="border-radius:12px;display:block;margin:0 auto 12px" />
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px">Edu<span style="color:#ef4444">51</span>Portal</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px">
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">Password Reset</h2>
            <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6">Hi <strong>${firstName}</strong>,</p>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6">
              We received a request to reset your <strong>Edu<span style="color:#ef4444">51</span>Portal</strong> password for the account
              <span style="color:#2563eb;font-weight:600">${bubtEmail}</span>.
            </p>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
              <tr>
                <td style="background:#2563eb;border-radius:10px">
                  <a href="${resetLink}"
                     style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5">
              This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your account is secure.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center">
            <p style="margin:0;color:#94a3b8;font-size:12px">
              &copy; 2025 Edu<span style="color:#ef4444">51</span>Portal &bull; BUBT CSE Student Portal
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return json({ error: "Failed to send reset email. Try again later." });
    }

    // Return masked recipient so the client can show a helpful hint
    const atIdx = recipientEmail.indexOf("@");
    const masked = recipientEmail.slice(0, 2) + "****" + recipientEmail.slice(atIdx);

    return json({ success: true, maskedEmail: masked });
  } catch (e) {
    console.error("send-password-reset error:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error." });
  }
});
