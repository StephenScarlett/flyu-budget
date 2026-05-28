"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import type { Chat, ChatMessage } from "../lib/supabase/types";

export function useChats(tripId: string | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!tripId) return;

    async function fetchChats() {
      const { data } = await supabase
        .from("chats")
        .select("*")
        .eq("trip_id", tripId!)
        .order("updated_at", { ascending: false });
      if (data) setChats(data as Chat[]);
      setLoading(false);
    }

    fetchChats();
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const createChat = useCallback(async () => {
    if (!tripId) return null;
    const { data } = await supabase
      .from("chats")
      .insert({ trip_id: tripId, title: "New Chat", messages: [] } as never)
      .select()
      .single();
    if (data) {
      const chat = data as Chat;
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
      return chat;
    }
    return null;
  }, [supabase, tripId]);

  const updateChat = useCallback(
    async (chatId: string, updates: { title?: string; messages?: ChatMessage[] }) => {
      const payload = { ...updates, updated_at: new Date().toISOString() };
      // Optimistic
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, ...payload } : c))
      );
      await supabase.from("chats").update(payload as never).eq("id", chatId);
    },
    [supabase]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) setActiveChatId(null);
      await supabase.from("chats").delete().eq("id", chatId);
    },
    [supabase, activeChatId]
  );

  return {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    createChat,
    updateChat,
    deleteChat,
    loading,
  };
}
