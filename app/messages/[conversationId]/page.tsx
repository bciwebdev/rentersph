"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

interface ConversationListItem {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  created_at: string;
  properties: {
    title: string;
    cover_image: string | null;
    price: number;
  } | null;
  last_message?: {
    message_text: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

export default function MessagesDashboardPage() {
  const { user, loading: authLoading } = useUser();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;

    fetchInbox(user.id);
  }, [user]);

  async function fetchInbox(userId: string) {
    try {
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          id,
          property_id,
          tenant_id,
          landlord_id,
          created_at,
          properties (
            title,
            cover_image,
            price
          )
        `)
        .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (convError) throw convError;

      const formattedInbox: ConversationListItem[] = [];

      for (const conv of convData ?? []) {
        const { data: msgData } = await supabase
          .from("messages")
          .select("message_text, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .not("sender_id", "eq", userId);

        formattedInbox.push({
          ...(conv as any),
          last_message: msgData?.[0] ?? null,
          unread_count: unreadCount ?? 0,
        });
      }

      formattedInbox.sort((a, b) => {
        const aTime = a.last_message
          ? new Date(a.last_message.created_at).getTime()
          : new Date(a.created_at).getTime();

        const bTime = b.last_message
          ? new Date(b.last_message.created_at).getTime()
          : new Date(b.created_at).getTime();

        return bTime - aTime;
      });

      setConversations(formattedInbox);
    } catch (err: any) {
      setError(err.message ?? "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Inbox</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage negotiations and chats with tenants and landlords.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">
            No conversations yet
          </h3>

          <p className="mb-5 text-gray-500">
            When you contact listings or receive inquiries, they will appear here.
          </p>

          <Link
            href="/"
            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-white"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {conversations.map((chat) => {
            const isUserLandlord = chat.landlord_id === user?.id;

            return (
              <Link
                key={chat.id}
                href={`/messages/${chat.id}`}
                className="block p-5 transition hover:bg-gray-50"
              >
                <div className="flex gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded border bg-gray-100">
                    {chat.properties?.cover_image ? (
                      <Image
                        src={chat.properties.cover_image}
                        alt="Property"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h2 className="truncate font-semibold">
                        {chat.properties?.title ?? "Property Inquiry"}
                      </h2>

                      {chat.last_message && (
                        <span className="text-xs text-gray-400">
                          {new Date(
                            chat.last_message.created_at
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        isUserLandlord
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isUserLandlord ? "Landlord" : "Tenant"}
                    </span>

                    <p className="mt-2 truncate text-sm text-gray-600">
                      {chat.last_message
                        ? `${chat.last_message.sender_id === user?.id ? "You: " : ""}${chat.last_message.message_text}`
                        : "No messages yet"}
                    </p>
                  </div>

                  {chat.unread_count > 0 && (
                    <div className="flex items-center">
                      <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs text-white">
                        {chat.unread_count}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}