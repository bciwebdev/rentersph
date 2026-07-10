"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

interface SendMessageProps {
  propertyId: number;     // Matches BIGINT type
  landlordId: string;     // UUID string
  propertyName: string;
}

export default function SendMessage({ propertyId, landlordId, propertyName }: SendMessageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState(`Hi! I am highly interested in inquiring about your listing: "${propertyName}". Is this still available?`);

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Defensive check: Prevent users from starting chats with themselves
    if (user.id === landlordId) {
      setError("You cannot start an inquiry chat on your own property listing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Check if an active conversation record already exists for this exact setup
      const { data: existingConversation, error: fetchError } = await supabase
        .from("conversations")
        .select("id")
        .eq("property_id", propertyId)
        .eq("tenant_id", user.id)
        .eq("landlord_id", landlordId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingConversation) {
        // If it exists, route directly to the active thread page
        router.push(`/messages/${existingConversation.id}`);
        return;
      }

      // 2. If no thread exists, create a new conversation channel record
      const { data: newConversation, error: insertConvError } = await supabase
        .from("conversations")
        .insert({
          property_id: propertyId,
          tenant_id: user.id,
          landlord_id: landlordId,
        })
        .select("id")
        .single();

      if (insertConvError) throw insertConvError;

      // 3. Inject the optional customized text message into the messages record table
      if (initialMessage.trim()) {
        const { error: insertMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: newConversation.id,
            sender_id: user.id,
            message_text: initialMessage.trim(),
          });

        if (insertMsgError) throw insertMsgError;
      }

      // 4. Send the user straight into their brand new chat workspace interface
      router.push(`/messages/${newConversation.id}`);

    } catch (err: any) {
      setError(err.message || "An error occurred while creating the message room.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {!isOpen ? (
        <button type="button" onClick={() => setIsOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md shadow-sm text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Inquire / Send Message
        </button>
      ) : (
        <form onSubmit={handleStartConversation} className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Send Inquiry Message
          </label>
          <textarea rows={4} required value={initialMessage} onChange={(e) => setInitialMessage(e.target.value)} disabled={loading} placeholder="Write your introductory message..." className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white resize-none disabled:bg-gray-100" />
          
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" disabled={loading} onClick={() => setIsOpen(false)} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !initialMessage.trim()} className="px-4 py-1.5 border border-transparent rounded text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5">
              {loading ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" viewBox="0 0 24 24" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Initializing...
                </>
              ) : (
                "Send Inquiry"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}