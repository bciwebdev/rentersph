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

    async function fetchInbox() {
      try {
        // Fetch conversations where current user is either the tenant or the landlord
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
          .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (convError) throw convError;

        const formattedInbox: ConversationListItem[] = [];

        // For each conversation, gather the latest message snippet and count unread counts
        for (const conv of (convData || [])) {
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
            .not("sender_id", "eq", user.id);

          const lastMessage = msgData && msgData.length > 0 ? msgData[0] : null;

          formattedInbox.push({
            ...(conv as any),
            last_message: lastMessage,
            unread_count: unreadCount || 0,
          });
        }

        // Sort dynamically based on latest message timestamps
        formattedInbox.sort((a, b) => {
          const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
          const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
          return timeB - timeA;
        });

        setConversations(formattedInbox);
      } catch (err: any) {
        setError(err.message || "Failed to load your message history inbox.");
      } finally {
        setLoading(false);
      }
    }

    fetchInbox();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">Manage negotiations and chats with tenants and landlords.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No conversations yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            When you contact listings or receive queries about your properties, they will display right here.
          </p>
          <Link href="/" className="mt-5 inline-block bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden divide-y divide-gray-100">
          {conversations.map((chat) => {
            const isUserLandlord = chat.landlord_id === user?.id;
            
            return (
              <Link key={chat.id} href={`/messages/${chat.id}`} className="block p-4 sm:p-5 hover:bg-gray-50/70 transition-colors relative group">
                <div className="flex items-start gap-4">
                  
                  {/* Property Cover Image Display */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden border bg-gray-50 flex-shrink-0">
                    {chat.properties?.cover_image ? (
                      <Image src={chat.properties.cover_image} alt="Property listing" fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="(max-width: 768px) 56px, 64px" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Thread Context Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {chat.properties?.title || "Property Listing Inquiry"}
                      </h2>
                      {chat.last_message && (
                        <span className="text-[11px] text-gray-400 flex-shrink-0">
                          {new Date(chat.last_message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* Role Tag badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        isUserLandlord ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {isUserLandlord ? "Landlord Context" : "Your Inquiry"}
                      </span>
                    </div>

                    {/* Message Preview Snippet */}
                    <p className={`text-xs sm:text-sm truncate ${chat.unread_count > 0 ? "text-gray-900 font-semibold" : "text-gray-500"}`}>
                      {chat.last_message ? (
                        <>
                          {chat.last_message.sender_id === user?.id ? "You: " : ""}
                          {chat.last_message.message_text}
                        </>
                      ) : (
                        <span className="italic text-gray-400">No messages in thread yet...</span>
                      )}
                    </p>
                  </div>

                  {/* Unread Alert Bubble Badge */}
                  {chat.unread_count > 0 && (
                    <div className="flex-shrink-0 self-center">
                      <span className="inline-flex items-center justify-center h-5 px-1.5 min-w-[20px] rounded-full bg-indigo-600 text-white text-[11px] font-bold shadow-sm">
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