"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignedUp, setIsSignedUp] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Explicitly redirect back to your callback route on verification link click
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Show the email verification screen instead of immediately redirecting to login
      setIsSignedUp(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Beautiful Success State to replace the form after signing up
  if (isSignedUp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Mail className="h-7 w-7 animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verify your email</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              We have sent a verification link to <span className="font-bold text-slate-800">{email}</span>. 
              Please check your inbox (and spam folder) to activate your account.
            </p>
          </div>

          <div className="pt-2">
            <Link 
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 p-3.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Join rentersPH today</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm font-semibold outline-none focus:border-emerald-500 transition-colors"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm font-semibold outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 p-3.5 text-sm font-black text-white hover:bg-emerald-700 transition duration-200 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center text-xs font-semibold text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}