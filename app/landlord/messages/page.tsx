"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import Link from "next/link";

export default function MessagesPage() {
  const { user } = useUser();
  const [threads, setThreads] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchThreads();
  }, [user]);

  async function fetchThreads() {
    const { data } = await supabase
      .from("message_threads")
      .select("*, properties(title)")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    setThreads(data || []);
  }

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">
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
                className="block border p-4 rounded hover:bg-gray-50"
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