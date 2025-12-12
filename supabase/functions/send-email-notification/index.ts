// Supabase Edge Function: Send Email Notification
// Uses Supabase's built-in email service or fallback to console log
// Deploy to: supabase/functions/send-email-notification/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  // Allow Supabase JS client headers to pass preflight
  "Access-Control-Allow-Headers": [
    "Content-Type",
    "Authorization",
    "apikey",
    "x-client-info",
    "x-requested-with"
  ].join(", "),
  "Access-Control-Max-Age": "86400",
};

interface EmailRequest {
  to: string;
  subject: string;
  htmlBody: string;
}

/**
 * Send email via Resend API
 */
async function sendViaResend(to: string, subject: string, htmlBody: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  // Change this to your verified sender email in Resend
  // - "onboarding@resend.dev" ✅ Works immediately (no verification needed)
  // - "edu51five@gmail.com" (waiting for verification)
  // - "noreply@edu51five.com" (if domain verified in Resend)
  const senderEmail = "onboarding@resend.dev";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: to,
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Resend API error: ${response.status} - ${error}`);
      return { success: false, error: `Resend error: ${response.status}` };
    }

    const data = await response.json();
    console.log(`✅ Email sent via Resend to ${to}, ID: ${data.id}`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error("Resend send error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, htmlBody } = await req.json() as EmailRequest;

    // Validate inputs
    if (!to || !subject || !htmlBody) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to, subject, htmlBody",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log email details (for development/testing)
    console.log(`📧 Email Request:`, {
      to,
      subject,
      htmlLength: htmlBody.length,
    });

    // Send via Resend (real email delivery)
    const { success, messageId, error: sendError } = await sendViaResend(to, subject, htmlBody);

    if (!success) {
      console.warn(`⚠️ Resend failed: ${sendError}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: sendError || "Failed to send email via Resend",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For now, return success (SMTP will be configured separately)
    // In production, this would integrate with SendGrid, Resend, or Supabase mail
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully via Resend",
        recipient: to,
        subject: subject,
        messageId: messageId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Exception in send-email-notification:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

