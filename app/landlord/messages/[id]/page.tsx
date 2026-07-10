"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export default function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", params.id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  async function sendReply() {
    if (!user || !text.trim()) return;

    await supabase.from("messages").insert({
      thread_id: params.id,
      sender_id: user.id,
      message: text,
    });

    setText("");
    fetchMessages();
  }

  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-bold">Chat</h1>

        <div className="space-y-2 border p-4 h-[400px] overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className="p-2 border rounded">
              {m.message}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 border p-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button
            onClick={sendReply}
            className="bg-blue-600 text-white px-4"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}