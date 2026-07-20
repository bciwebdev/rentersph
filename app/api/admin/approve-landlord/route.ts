import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { userId, verificationId, landlordEmail, landlordName } = await req.json()

    // 1. Update Database Status
    await supabase
      .from('profiles')
      .update({ is_verified: true, full_name: landlordName })
      .eq('id', userId)

    await supabase
      .from('landlord_verifications')
      .update({ status: 'approved' })
      .eq('id', verificationId)

    // 2. Send Welcome Email via Resend
    if (landlordEmail) {
      await resend.emails.send({
        from: 'RentersPH <onboarding@resend.dev>', // Use your verified Resend domain/email here
        to: [landlordEmail],
        subject: '🎉 Your RentersPH Landlord Account is Officially Verified!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #00aa4f;">Welcome to RentersPH, ${landlordName || 'Landlord'}!</h2>
            <p>Great news! Your identity verification has been reviewed and officially approved by our team.</p>
            
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 12px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #111;">What this means for you:</h4>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li><strong>Verified Badge:</strong> Your listings will now show an official Verified Landlord badge to build instant trust with tenants.</li>
                <li><strong>Priority Visibility:</strong> Verified properties get higher preference in tenant search filters.</li>
                <li><strong>Direct Inquiries:</strong> Prospective renters can reach out to you directly through our platform.</li>
              </ul>
            </div>

            <p>Ready to manage or post your listings?</p>
            <a href="https://rentersph-app.vercel.app" style="display: inline-block; background-color: #00aa4f; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Landlord Portal</a>
            
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">If you have any questions, feel free to reach out to our support team.</p>
          </div>
        `
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Approve error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}