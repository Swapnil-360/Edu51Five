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

    const recipientEmail = profile.notification_email as string | null;
    if (!recipientEmail) {
      return json({
        error: "No recovery email on file. Please contact an admin to reset your password.",
      }, 400);
    }

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

    // Send via Resend (already configured in the project)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return json({ error: "Email service not configured (RESEND_API_KEY missing)." }, 500);
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Edu51Five <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: "Reset your Edu51Five password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
            <h2 style="color:#3b82f6;margin-bottom:8px">Password Reset</h2>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your <strong>Edu51Five</strong> password for the account <code>${bubtEmail}</code>.</p>
            <p style="margin:24px 0">
              <a href="${resetLink}"
                 style="background:#3b82f6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
                Reset Password
              </a>
            </p>
            <p style="color:#6b7280;font-size:13px">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return json({ error: "Failed to send reset email. Try again later." }, 500);
    }

    // Return masked recipient so the client can show a helpful hint
    const atIdx = recipientEmail.indexOf("@");
    const masked = recipientEmail.slice(0, 2) + "****" + recipientEmail.slice(atIdx);

    return json({ success: true, maskedEmail: masked });
  } catch (e) {
    console.error("send-password-reset error:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error." }, 500);
  }
});
