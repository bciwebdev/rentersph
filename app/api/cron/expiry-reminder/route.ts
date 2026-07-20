import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    console.log("Cron job started");

    // Initialize Supabase using Service Role Key
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

    // Send email reminders
    if (records && records.length > 0) {
      for (const record of records) {
        if (!record.email) continue;

        await resend.emails.send({
          from: 'rentersph.com', // Replace with your verified custom domain email
          to: record.email,
          subject: 'Listing Expiry Reminder - RentersPH',
          text: `Hello! Your property listing "${record.title || 'Property'}" is scheduled to expire tomorrow. Please log in to renew your listing.`,
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