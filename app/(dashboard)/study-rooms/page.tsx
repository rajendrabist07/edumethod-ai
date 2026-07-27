"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { GlassCard } from "@/app/components/ui/GlassCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "mock_key"
);

export default function StudyRoomsPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Join a global "lobby" channel for demonstration
    const room = supabase.channel("study_room_lobby", {
      config: {
        presence: { key: user.id },
      },
    });

    room
      .on("presence", { event: "sync" }, () => {
        const state = room.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .on("broadcast", { event: "chat_message" }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await room.track({ user: user.firstName });
        }
      });

    return () => {
      supabase.removeChannel(room);
    };
  }, [user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const payload = { user: user.firstName || "Student", text: input };
    
    // Optimistic UI update
    setMessages((prev) => [...prev, payload]);
    
    await supabase.channel("study_room_lobby").send({
      type: "broadcast",
      event: "chat_message",
      payload,
    });
    
    setInput("");
  };

  return (
    <main className="p-6 h-[calc(100vh-64px)] flex flex-col text-prism-text">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-black">Global Study Lobby</h1>
          <p className="text-sm text-prism-muted mt-1">Connect with other students in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-prism-muted">{onlineCount} Online</span>
        </div>
      </div>

      <GlassCard className="flex-grow flex flex-col overflow-hidden border border-prism-border">
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-prism-muted mt-10">It's quiet here. Say hello!</div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xs font-bold text-prism-accent mb-1">{msg.user}</span>
                <span className="bg-prism-surface/50 p-3 rounded-xl rounded-tl-none w-fit text-sm">
                  {msg.text}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-prism-border bg-prism-surface/30">
          <form onSubmit={sendMessage} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question to the room..."
              className="flex-grow bg-prism-base border border-prism-border rounded-xl px-4 py-2 focus:outline-none focus:border-prism-accent text-sm transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-prism-accent text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50 hover:bg-opacity-90 transition-all"
            >
              Send
            </button>
          </form>
        </div>
      </GlassCard>
    </main>
  );
}
