"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export default function MessagesPage() {
  const { user, loading } = useUser();
  const [threads, setThreads] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user) {
      fetchThreads(user.id);
    }
  }, [user, loading]);

  async function fetchThreads(userId: string) {
    const { data } = await supabase
      .from("message_threads")
      .select("*, properties(title)")
      .eq("landlord_id", userId)
      .order("created_at", { ascending: false });

    setThreads(data ?? []);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">
          Messages
        </h1>

        {threads.length === 0 ? (
          <p className="text-gray-500">No messages yet</p>
        ) : (
          <div className="space-y-3">
            {threads.map((t) => (
              <Link
                key={t.id}
                href={`/landlord/messages/${t.id}`}
                className="block rounded border p-4 hover:bg-gray-50"
              >
                <p className="font-semibold">
                  {t.properties?.title}
                </p>
                <p className="text-sm text-gray-500">
                  Thread #{t.id}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}