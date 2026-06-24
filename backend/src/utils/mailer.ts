import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER || 'dainnaindia@gmail.com';
const emailPassword = process.env.EMAIL_PASSWORD || 'lkvo uzvk mijn cfgk';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email using the configured SMTP transporter.
 * If EMAIL_PASSWORD is not configured, it prints a fallback warning with the email contents.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const from = process.env.EMAIL_FROM || `"Dainna" <${emailUser}>`;

  if (!emailPassword) {
    console.warn(`[Mailer Warning] EMAIL_PASSWORD is not set. Email simulation below:`);
    console.warn(`Recipient: ${to}`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Text: ${text}`);
    if (html) {
      console.warn(`HTML: ${html}`);
    }
    return { success: false, error: 'EMAIL_PASSWORD not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Mailer] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Mailer Error] Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
}
