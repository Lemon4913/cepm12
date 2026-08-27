import "server-only";
import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Talat Tha Na <onboarding@resend.dev>";

export async function sendOtpEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev/local fallback: no email provider configured, so log instead of sending.
    // Never happens in production once RESEND_API_KEY is set on the deploy platform.
    console.log(`[dev] OTP code for ${to}: ${code}`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `รหัสยืนยันตัวตนของคุณ: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="color: #0e8983;">ตลาดท่านา · Talat Tha Na</h2>
        <p>รหัสยืนยันตัวตนของคุณคือ</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.2em; color: #16302d;">${code}</p>
        <p style="color: #666;">รหัสนี้จะหมดอายุใน 10 นาที หากคุณไม่ได้เป็นผู้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}
