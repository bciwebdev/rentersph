"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  User,
  Session,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <Link href="/" className="text-xl font-bold">
        Renters PH
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/landlord">Dashboard</Link>

        {user ? (
          <button
            onClick={handleLogout}
            className="rounded bg-red-600 px-3 py-1 text-white"
          >
            Logout
          </button>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}