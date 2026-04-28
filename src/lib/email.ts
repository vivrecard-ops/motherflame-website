import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLicenseEmail(email: string, licenseKey: string) {
  const { error } = await resend.emails.send({
    from: "MotherFlame <onboarding@resend.dev>",
    to: email,
    subject: "Your MotherFlame Meta Access license key",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fafafa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#581c87,#831843);padding:32px 40px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">MotherFlame</p>
            <p style="margin:8px 0 0;font-size:13px;color:#e879f9;">Meta Access · Activated</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:15px;color:#a1a1aa;">Thanks for subscribing. Here is your license key:</p>

            <!-- License key box -->
            <div style="background:#09090b;border:1px solid #3f3f46;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">License key</p>
              <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:4px;color:#f0abfc;font-family:'Courier New',monospace;">${licenseKey}</p>
            </div>

            <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;line-height:1.6;">
              Open <strong style="color:#fafafa;">MotherFlame</strong>, go to <strong style="color:#fafafa;">Settings → License</strong> and paste this key to unlock the Meta tab.
            </p>

            <p style="margin:0;font-size:13px;color:#52525b;line-height:1.6;">
              Your subscription renews automatically each month. You can cancel anytime from your
              <a href="https://billing.stripe.com" style="color:#a855f7;text-decoration:none;">Stripe billing portal</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #27272a;">
            <p style="margin:0;font-size:12px;color:#3f3f46;text-align:center;">
              © MotherFlame · optcg-motherflame.com
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
  if (error) {
    console.error("[email] resend error", error);
    throw new Error(`Email send failed: ${JSON.stringify(error)}`);
  }
}
