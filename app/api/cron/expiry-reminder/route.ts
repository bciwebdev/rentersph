import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // 1. Calculate target date (3 days from today)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    // 2. Query properties expiring on that target date
    const { data: expiringListings, error } = await supabase
      .from('properties')
      .select('id, title, expiration_date, profiles(email, full_name)')
      .eq('expiration_date', targetDateStr)

    if (error) throw error

    // 3. Loop and send notification email to each owner
    if (expiringListings && expiringListings.length > 0) {
      for (const listing of expiringListings) {
        const owner = listing.profiles as any
        if (!owner?.email) continue

        await resend.emails.send({
          from: 'RentersPH Notifications <notifications@resend.dev>', // Use your verified Resend domain/email
          to: [owner.email],
          subject: `⚠️ Action Required: Listing "${listing.title}" expires in 3 days`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #d97706;">Your property listing is about to expire!</h2>
              <p>Hello ${owner.full_name || 'Landlord'},</p>
              <p>This is a quick reminder that your listing <strong>"${listing.title}"</strong> will expire on <strong>${listing.expiration_date}</strong>.</p>
              
              <p>To keep your property visible to potential tenants and avoid interruption, please extend your listing from your landlord dashboard.</p>

              <a href="https://rentersph-app.vercel.app" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">Renew Listing Now</a>
            </div>
          `
        })
      }
    }

    return NextResponse.json({ success: true, count: expiringListings?.length || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}