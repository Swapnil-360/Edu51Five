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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { bubtEmail, redirectTo } = await req.json() as { bubtEmail: string; redirectTo: string };

    if (!bubtEmail?.endsWith("@cse.bubt.edu.bd")) {
      return json({ error: "Must be a @cse.bubt.edu.bd email." }, 400);
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
      return json({ error: "No account found for that email." }, 404);
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
      }, 400);
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
      return json({ error: linkErr?.message ?? "Could not generate reset link." }, 500);
    }

    const resetLink = linkData.properties.action_link;
    const firstName = (profile.name as string | null)?.split(" ")[0] ?? "Student";

    const brevoKey = Deno.env.get("BREVO_API_KEY");

    if (!brevoKey) {
      return json(
        { error: "Email service not configured (BREVO_API_KEY missing)." },
        500,
      );
    }

    const emailRes = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify({
          sender: {
            name: "Edu51Portal",
            email: "asifaliai2026@gmail.com"
          },
          to: [
            {
              email: recipientEmail,
              name: firstName
            }
          ],
          subject: "Reset your Edu51Portal password",
          htmlContent: `
            <div style="font-family:system-ui, -apple-system, sans-serif;max-width:480px;margin:auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
              <h2 style="color:#0f172a;margin-bottom:16px;font-size:20px;font-weight:700">Edu<span style="color:#ef4444">51</span>Portal Password Reset</h2>
              <p style="color:#334155;font-size:15px;line-height:1.5">Hi ${firstName},</p>
              <p style="color:#334155;font-size:15px;line-height:1.5">We received a request to reset your <strong>Edu51Portal</strong> password for the account <code>${bubtEmail}</code>.</p>
              <p style="margin:28px 0;text-align:center">
                <a href="${resetLink}"
                   style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;font-size:15px;box-shadow:0 4px 12px rgba(37,99,235,0.2)">
                  Reset Password
                </a>
              </p>
              <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0" />
              <p style="color:#64748b;font-size:12px;line-height:1.5">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
            </div>
          `,
        }),
      },
    );

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Brevo error:", errBody);

      return json(
        {
          error: "Failed to send reset email. Try again later.",
          details: errBody,
        },
        500,
      );
    }

    const brevoResponse = await emailRes.text();
    console.log("Brevo success:", brevoResponse);

    // Return masked recipient so the client can show a helpful hint
    const atIdx = recipientEmail.indexOf("@");
    const masked = recipientEmail.slice(0, 2) + "****" + recipientEmail.slice(atIdx);

    return json({ success: true, maskedEmail: masked });
  } catch (e) {
    console.error("send-password-reset error:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error." }, 500);
  }
});
