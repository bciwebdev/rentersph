'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } 
          catch {}
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentersph-app.vercel.app'}/auth/callback`,
    },
  })

  // If there is a legitimate error, return it
  if (error) {
    return { error: error.message }
  }

  // If we reach here, Supabase considers it a success (even if email confirmation is pending)
  return { 
    success: true, 
    message: "Account created! Please check your email inbox to verify your account." 
  }
}