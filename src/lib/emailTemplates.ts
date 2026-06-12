export function getConfirmSignupTemplate(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Your Signup - Edu51 Portal</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;background-color:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:36px;font-weight:bold;letter-spacing:-0.5px;">Edu<span style="color:#ef4444">51</span> Portal</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-weight:500;">BUBT Intake 51 Excellence Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px 0;color:#1f2937;font-size:24px;font-weight:600;">Welcome to Edu<span style="color:#ef4444">51</span> Portal! 🎉</h2>
              <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:1.6;">Hi there,</p>
              <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:1.6;">Thank you for joining <strong>Edu<span style="color:#ef4444">51</span> Portal</strong> - your academic portal for course materials, exam tracking, and semester progress. We're excited to have you onboard!</p>
              <p style="margin:0 0 30px 0;color:#4b5563;font-size:16px;line-height:1.6;">To complete your registration and activate your account, please confirm your email address by clicking the button below:</p>
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 0 30px 0;">
                    <a href="${confirmationUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(102,126,234,0.4);transition:transform 0.2s;">Confirm Your Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;line-height:1.6;">Or copy and paste this link into your browser:</p>
              <p style="margin:0 0 30px 0;padding:12px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;color:#667eea;font-size:13px;word-break:break-all;">${confirmationUrl}</p>
              <div style="margin:30px 0;padding:20px;background-color:#f9fafb;border-left:4px solid #667eea;border-radius:4px;">
                <h3 style="margin:0 0 12px 0;color:#1f2937;font-size:16px;font-weight:600;">What's inside Edu<span style="color:#ef4444">51</span> Portal:</h3>
                <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8;">
                  <li>📚 Access course materials (notes, slides, CT questions)</li>
                  <li>📅 Real-time semester progress tracking</li>
                  <li>📝 Exam schedules and countdown timers</li>
                  <li>🎯 Study suggestions and super tips</li>
                  <li>🔔 Important notices and updates</li>
                </ul>
              </div>
              <p style="margin:20px 0 0 0;color:#6b7280;font-size:14px;line-height:1.6;">This confirmation link will expire in <strong>24 hours</strong>. If you didn't create an account with Edu<span style="color:#ef4444">51</span> Portal, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;background-color:#f9fafb;border-radius:0 0 12px 12px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;">Need help? Contact us at <a href="mailto:support@edu51five.com" style="color:#667eea;text-decoration:none;">support@edu51five.com</a></p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 Edu<span style="color:#ef4444">51</span> Portal - BUBT Intake 51, Section 5 (CSE)</p>
              <p style="margin:8px 0 0 0;color:#9ca3af;font-size:11px;">Bangladesh University of Business & Technology</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getResetPasswordTemplate(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password - Edu51 Portal</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;background-color:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:36px;font-weight:bold;letter-spacing:-0.5px;">Edu<span style="color:#ef4444">51</span> Portal</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-weight:500;">BUBT Intake 51 Excellence Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px 0;color:#1f2937;font-size:24px;font-weight:600;">Reset Your Password 🔐</h2>
              <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:1.6;">Hi,</p>
              <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:1.6;">We received a request to reset your password for your Edu<span style="color:#ef4444">51</span> Portal account. If you didn't make this request, you can safely ignore this email.</p>
              <p style="margin:0 0 30px 0;color:#4b5563;font-size:16px;line-height:1.6;">To set a new password, click the button below:</p>
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 0 30px 0;">
                    <a href="${resetUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(245,158,11,0.4);transition:transform 0.2s;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;line-height:1.6;">Or copy and paste this link into your browser:</p>
              <p style="margin:0 0 30px 0;padding:12px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;color:#d97706;font-size:13px;word-break:break-all;">${resetUrl}</p>
              <div style="margin:30px 0;padding:20px;background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
                <h3 style="margin:0 0 8px 0;color:#92400e;font-size:14px;font-weight:600;">⚠️ Security Reminder:</h3>
                <ul style="margin:0;padding-left:20px;color:#78350f;font-size:13px;line-height:1.6;">
                  <li>Never share your password with anyone</li>
                  <li>Edu<span style="color:#ef4444">51</span> Portal team will never ask for your password</li>
                  <li>This link expires in 24 hours</li>
                </ul>
              </div>
              <p style="margin:20px 0 0 0;color:#6b7280;font-size:14px;line-height:1.6;">If you didn't request a password reset, please change your password immediately or contact our support team.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;background-color:#f9fafb;border-radius:0 0 12px 12px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;">Need help? Contact us at <a href="mailto:support@edu51five.com" style="color:#f59e0b;text-decoration:none;">support@edu51five.com</a></p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 Edu<span style="color:#ef4444">51</span> Portal - BUBT Intake 51, Section 5 (CSE)</p>
              <p style="margin:8px 0 0 0;color:#9ca3af;font-size:11px;">Bangladesh University of Business & Technology</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getChangeEmailTemplate(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Email Change - Edu51 Portal</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;background-color:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:36px;font-weight:bold;letter-spacing:-0.5px;">Edu<span style="color:#ef4444">51</span> Portal</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-weight:500;">BUBT Intake 51 Excellence Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px 0;color:#1f2937;font-size:24px;font-weight:600;">Confirm Your New Email ✉️</h2>
              <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:1.6;">Hi,</p>
              <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:1.6;">You requested to change the email address associated with your Edu<span style="color:#ef4444">51</span> Portal account. To confirm this change, please click the button below:</p>
              <p style="margin:0 0 30px 0;color:#4b5563;font-size:16px;line-height:1.6;">Your account will use this email for all future communications once confirmed.</p>
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 0 30px 0;">
                    <a href="${confirmUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(139,92,246,0.4);transition:transform 0.2s;">Confirm Email Change</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;line-height:1.6;">Or copy and paste this link into your browser:</p>
              <p style="margin:0 0 30px 0;padding:12px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;color:#7c3aed;font-size:13px;word-break:break-all;">${confirmUrl}</p>
              <div style="margin:30px 0;padding:20px;background-color:#f3e8ff;border-left:4px solid #8b5cf6;border-radius:4px;">
                <h3 style="margin:0 0 8px 0;color:#5b21b6;font-size:14px;font-weight:600;">📧 What's changing:</h3>
                <p style="margin:0;color:#6b21b6;font-size:13px;line-height:1.6;">Your Edu<span style="color:#ef4444">51</span> Portal account will be accessible with the new email address. You can use the new email for login, notifications, and account recovery.</p>
              </div>
              <p style="margin:20px 0 0 0;color:#6b7280;font-size:14px;line-height:1.6;">This confirmation link will expire in <strong>24 hours</strong>. If you didn't request an email change, please secure your account immediately.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;background-color:#f9fafb;border-radius:0 0 12px 12px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;">Need help? Contact us at <a href="mailto:support@edu51five.com" style="color:#8b5cf6;text-decoration:none;">support@edu51five.com</a></p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 Edu<span style="color:#ef4444">51</span> Portal - BUBT Intake 51, Section 5 (CSE)</p>
              <p style="margin:8px 0 0 0;color:#9ca3af;font-size:11px;">Bangladesh University of Business & Technology</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

