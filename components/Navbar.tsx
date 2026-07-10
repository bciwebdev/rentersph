"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <Link href="/" className="font-bold text-xl">
        Renters PH
      </Link>

      <div className="flex gap-4 items-center">
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