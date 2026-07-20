import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { landlordId, email } = await request.json();

    if (!landlordId) {
      return NextResponse.json({ error: "Landlord ID is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Update status in landlord_verifications table
    const { data, error } = await supabase
      .from('landlord_verifications')
      .update({ status: 'approved' })
      .eq('id', landlordId)
      .select('email')
      .single();

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    const targetEmail = email || data?.email;

    // 2. Send Welcome Email via Resend
    if (targetEmail) {
      const emailSubject = "Welcome to RentersPH!";

      const emailHtmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333333; line-height: 1.6;">
          <p style="font-size: 16px; margin-bottom: 16px;">Hi there,</p>

          <p style="font-size: 18px; font-weight: bold; color: #0070f3; margin-bottom: 16px;">
            Welcome to RentersPH!
          </p>

          <p style="font-size: 15px; margin-bottom: 16px;">
            Thank you for registering as a landlord. We're excited to have you join our growing community, and we hope RentersPH becomes a valuable tool in helping you find quality tenants quickly and easily.
          </p>

          <p style="font-size: 15px; margin-bottom: 24px;">
            Start listing your property today and connect with renters <strong>10× faster</strong>. The sooner your listing goes live, the sooner interested renters can discover it.
          </p>

          <div style="margin: 28px 0; text-align: center;">
            <a href="https://rentersph.com" style="background-color: #0070f3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Get Started on RentersPH
            </a>
          </div>

          <p style="font-size: 15px; margin-bottom: 24px;">
            Thank you for trusting RentersPH. We look forward to helping you fill your vacancies!
          </p>

          <p style="font-size: 15px; margin-bottom: 4px;">Best regards,</p>
          <p style="font-size: 15px; font-weight: bold; margin-top: 0;">The RentersPH Team</p>
        </div>
      `;

      await resend.emails.send({
        from: 'notifications@rentersph.com', // Replace with your verified sender domain email
        to: targetEmail,
        subject: emailSubject,
        html: emailHtmlBody,
      });

      console.log(`Welcome email sent to approved landlord: ${targetEmail}`);
    }

    return NextResponse.json({ success: true, message: "Landlord approved and welcome email sent" });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("APPROVE_LANDLORD_FAILED:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}