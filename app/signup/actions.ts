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
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Can be ignored if middleware handles redirects
          }
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

  // 1. If there is a real error (like invalid email format), return it
  if (error && !error.message.includes("confirmation")) {
    return { error: error.message }
  }

  // 2. If Supabase says "confirmation required", DO NOT return it as an error.
  // Instead, return success so your page.tsx shows your custom message.
  return { 
    success: true, 
    message: "Account created! Please check your email inbox to verify your account." 
  }
}