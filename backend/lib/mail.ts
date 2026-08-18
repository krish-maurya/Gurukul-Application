/**
 * Brevo (formerly Sendinblue) transactional email utility.
 *
 * Uses the Brevo HTTP API directly — no SDK dependency required.
 * Set BREVO_API_KEY and optionally BREVO_SENDER_EMAIL / BREVO_SENDER_NAME
 * in your .env file.
 */

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

interface SendMailOptions {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
}

export async function sendMail({ to, subject, htmlContent }: SendMailOptions) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@gurukul.edu";
  const senderName = process.env.BREVO_SENDER_NAME || "Gurukul";

  const res = await fetch(BREVO_API, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to.email, name: to.name || to.email }],
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[mail] Brevo API error:", res.status, err);
    throw new Error(err.message || `Brevo API responded with ${res.status}`);
  }

  return res.json();
}

/**
 * Build the HTML email body for a teacher invitation.
 */
export function buildInviteEmail(opts: {
  teacherName: string;
  inviteUrl: string;
  expiresInDays: number;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Gurukul</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:18px;">You're Invited!</h2>
            <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
              Hello <strong>${opts.teacherName}</strong>,<br/>
              You've been invited to join Gurukul as a teacher. Click the button below to set up your account.
            </p>
            <a href="${opts.inviteUrl}"
               style="display:inline-block;background:#6366f1;color:#ffffff;font-size:14px;font-weight:600;
                      text-decoration:none;padding:12px 28px;border-radius:8px;">
              Accept Invitation
            </a>
            <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
              This invitation link is valid for ${opts.expiresInDays} days. If the button doesn't work, paste this URL in your browser:<br/>
              <a href="${opts.inviteUrl}" style="color:#6366f1;word-break:break-all;">${opts.inviteUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
              &copy; Gurukul &mdash; AI-first Operating System for Schools
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/** Email carrying the parent portal magic link. */
export function buildPortalLinkEmail(opts: {
  parentName: string;
  studentName: string;
  portalUrl: string;
}) {
  return {
    subject: `Your parent portal for ${opts.studentName} — Gurukul`,
    htmlContent: `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr><td style="background:#0f172a;padding:24px 32px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;">GURUKUL</span>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 8px;font-size:15px;color:#0f172a;font-weight:600;">Dear ${opts.parentName},</p>
        <p style="margin:0 0 20px;font-size:13px;color:#475569;line-height:1.6;">
          Here is your personal link to follow <strong>${opts.studentName}</strong>'s school life —
          attendance, fees, timetable and messages from teachers, all in one place.
          No app or password needed; keep this link private.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td style="background:#0ea5e9;border-radius:10px;">
          <a href="${opts.portalUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Open ${opts.studentName}'s Portal</a>
        </td></tr></table>
        <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">If the button doesn't work, copy this link:<br/>${opts.portalUrl}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  };
}

/** Short notification that a new message is waiting on the portal. */
export function buildNewMessageEmail(opts: {
  parentName: string;
  studentName: string;
  title: string;
  portalUrl: string;
}) {
  return {
    subject: `New message about ${opts.studentName} — Gurukul`,
    htmlContent: `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr><td style="background:#0f172a;padding:20px 32px;"><span style="color:#ffffff;font-size:16px;font-weight:700;">GURUKUL</span></td></tr>
      <tr><td style="padding:28px 32px;">
        <p style="margin:0 0 8px;font-size:14px;color:#0f172a;font-weight:600;">Dear ${opts.parentName},</p>
        <p style="margin:0 0 18px;font-size:13px;color:#475569;line-height:1.6;">
          The school has sent you a new message about <strong>${opts.studentName}</strong>:
          <em>"${opts.title}"</em>
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background:#0ea5e9;border-radius:10px;">
          <a href="${opts.portalUrl}" style="display:inline-block;padding:11px 24px;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Read on the Portal</a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  };
}
