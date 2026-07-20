import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    console.log("Cron job started");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate start and end of tomorrow (UTC)
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setUTCHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setUTCHours(23, 59, 59, 999);

    // Query properties table for listings expiring tomorrow
    const { data: records, error } = await supabase
      .from('properties')
      .select('email, title, expires_at')
      .gte('expires_at', tomorrowStart.toISOString())
      .lte('expires_at', tomorrowEnd.toISOString());

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    console.log(`Found ${records?.length || 0} expiring listing(s)`);

    if (records && records.length > 0) {
      for (const record of records) {
        if (!record.email) continue;

        const emailSubject = "Reminder: Your RentersPH Property Listing is Expiring Soon";

        const emailHtmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333333; line-height: 1.6;">
            <p style="font-size: 16px;">Hi there,</p>
            <p style="font-size: 15px;">
              This is a friendly reminder that your property listing on <strong>RentersPH</strong> is approaching its 30-day expiration.
            </p>
            <p style="font-size: 15px;">
              To keep your property visible to renters, please log in to your landlord account and renew your listing before it expires.
            </p>
            <p style="font-size: 15px;">
              Want even more exposure? Boost your listing to appear in our Featured Rentals section and increase your chances of finding renters faster.
            </p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="https://rentersph.com" style="background-color: #0070f3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Renew or Boost Your Listing
              </a>
            </div>
            <p style="font-size: 15px;">
              Visit your landlord account today to renew or boost your listing and keep attracting potential tenants.
            </p>
            <p style="font-size: 15px;">
              Thank you for choosing RentersPH!
            </p>
            <br />
            <p style="font-size: 15px; margin-bottom: 0;">Best regards,</p>
            <p style="font-size: 15px; font-weight: bold; margin-top: 4px;">The RentersPH Team</p>
          </div>
        `;

        await resend.emails.send({
          from: 'notifications@rentersph.com', // Change to your verified email
          to: record.email,
          subject: emailSubject,
          html: emailHtmlBody,
        });

        console.log(`Reminder email sent to: ${record.email}`);
      }
    }

    console.log("Cron job finished successfully");
    return NextResponse.json({ success: true, count: records?.length || 0 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("CRON_JOB_FAILED:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}