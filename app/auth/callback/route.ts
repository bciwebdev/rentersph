import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/landlord'

  // Securely fall back to your production URL if the incoming request origin is unstable
  const liveOrigin = origin && origin !== 'null' ? origin : 'https://rentersph-app.vercel.app'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Can be ignored if middleware is handling redirects
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Return your script that forces the browser to commit cookies before redirecting
      return new NextResponse(
        `<html>
          <body>
            <p>Verifying session, please wait...</p>
            <script>
              setTimeout(() => {
                window.location.href = "${liveOrigin}${next}";
              }, 100);
            </script>
          </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      )
    }
  }

  // Fallback to login page on failure
  return NextResponse.redirect(`${liveOrigin}/login?error=auth_callback_failed`)
}