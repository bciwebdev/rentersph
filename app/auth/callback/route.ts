import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  // 1. Properly extract the URL details from the request
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const origin = requestUrl.origin

  // 2. Await the async cookies for Next.js 15
  const cookieStore = await cookies()

  // 3. Initialize Supabase Server Client
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
            // The `setAll` method can be called from a Server Component
            // which can sometimes throw if middleware has already run.
          }
        },
      },
    }
  )

  // 4. Exchange code for session if present
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if "next" is already a full URL or a relative path
      if (next.startsWith('http')) {
        return NextResponse.redirect(next)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code exchange fails or isn't present, safely return to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}