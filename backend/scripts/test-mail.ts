/**
 * Quick test script to verify Brevo email configuration.
 * Usage: npx tsx scripts/test-mail.ts
 */

import { sendMail } from "../lib/mail";

async function main() {
  console.log("🔧 Testing Brevo email configuration...\n");
  console.log(
    "  BREVO_API_KEY:",
    process.env.BREVO_API_KEY
      ? `${process.env.BREVO_API_KEY.slice(0, 8)}...`
      : "❌ NOT SET",
  );
  console.log(
    "  BREVO_SENDER_EMAIL:",
    process.env.BREVO_SENDER_EMAIL || "(default: noreply@gurukul.edu)",
  );
  console.log(
    "  BREVO_SENDER_NAME:",
    process.env.BREVO_SENDER_NAME || "(default: Gurukul)",
  );
  console.log();

  try {
    const result = await sendMail({
      to: { email: "test.snehpatel.dev@gmail.com", name: "Sneh Patel" },
      subject: "✅ Gurukul — Brevo Configuration Test",
      htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <tr>
          <td style="background:#0f172a;padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Gurukul</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:18px;">🎉 Configuration Successful!</h2>
            <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
              Hello <strong>Sneh</strong>,<br/>
              This is a test email from your Gurukul application. If you're reading this, your Brevo email configuration is working perfectly!
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
              <p style="margin:0;color:#166534;font-size:13px;font-weight:600;">✅ All systems go!</p>
              <p style="margin:4px 0 0;color:#166534;font-size:12px;">Teacher invitation emails will be delivered successfully.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
              &copy; Gurukul — AI-first Operating System for Schools
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    console.log("✅ Email sent successfully!");
    console.log("  Response:", JSON.stringify(result));
    console.log(
      "\n📬 Check snehpatel1233@gmail.com for the test email (also check spam folder).",
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Failed to send email:", message);
    process.exit(1);
  }
}

main();
