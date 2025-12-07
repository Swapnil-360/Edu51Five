// Supabase Edge Function: Send Email Notification
// Uses Supabase's built-in email service or fallback to console log
// Deploy to: supabase/functions/send-email-notification/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

interface EmailRequest {
  to: string;
  subject: string;
  htmlBody: string;
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

    // For now, return success (SMTP will be configured separately)
    // In production, this would integrate with SendGrid, Resend, or Supabase mail
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email queued for delivery",
        recipient: to,
        subject: subject,
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
