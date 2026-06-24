import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();
    if (!email || !token) {
      return NextResponse.json({ success: false, error: 'Email and token are required.' }, { status: 400 });
    }

    // 1. Fetch the pending email content from the backend securely
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    console.log(`[Vercel Mailer] Fetching pending email payload from backend using token...`);
    const backendRes = await fetch(`${backendUrl}/api/auth/fetch-pending-email?token=${token}`);
    
    if (!backendRes.ok) {
      const errText = await backendRes.text();
      console.error(`[Vercel Mailer] Failed to fetch email payload from backend: ${errText}`);
      return NextResponse.json({ success: false, error: `Backend fetch failed: ${errText}` }, { status: backendRes.status });
    }

    const backendData: any = await backendRes.json();
    if (!backendData.success || !backendData.payload) {
      return NextResponse.json({ success: false, error: 'Invalid payload from backend' }, { status: 400 });
    }

    const { to, subject, text, html } = backendData.payload;

    // Double check email match for security
    if (to.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Recipient address mismatch' }, { status: 403 });
    }

    // 2. Setup Nodemailer transport on Vercel
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
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    });

    const from = process.env.EMAIL_FROM || `"Dainna" <${emailUser}>`;

    console.log(`[Vercel Mailer] Dispatching email to ${to} via local SMTP...`);
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Vercel Mailer] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error(`[Vercel Mailer Error] Exception during dispatch:`, error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
