"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import type { Member } from "../lib/supabase/types";

export function useMembers(tripId: string | undefined) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!tripId) return;

    async function fetchMembers() {
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("trip_id", tripId!)
        .order("created_at", { ascending: true });
      if (data) setMembers(data);
      setLoading(false);
    }

    fetchMembers();

    const channel = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `trip_id=eq.${tripId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMembers((prev) => [...prev, payload.new as Member]);
          } else if (payload.eventType === "UPDATE") {
            setMembers((prev) =>
              prev.map((m) => (m.id === (payload.new as Member).id ? (payload.new as Member) : m))
            );
          } else if (payload.eventType === "DELETE") {
            setMembers((prev) => prev.filter((m) => m.id !== (payload.old as Member).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addMember = useCallback(
    async (member: Omit<Member, "id" | "created_at">): Promise<string | null> => {
      const tempId = crypto.randomUUID();
      const optimistic = { ...member, id: tempId, created_at: new Date().toISOString() } as Member;
      setMembers((prev) => [...prev, optimistic]);
      const { data } = await supabase.from("members").insert(member as never).select().single();
      if (data) {
        setMembers((prev) => prev.map((m) => (m.id === tempId ? (data as Member) : m)));
        return (data as Member).id;
      }
      return null;
    },
    [supabase]
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<Member>) => {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
      await supabase.from("members").update(updates as never).eq("id", id);
    },
    [supabase]
  );

  const deleteMember = useCallback(
    async (id: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      await supabase.from("members").delete().eq("id", id);
    },
    [supabase]
  );

  return { members, loading, addMember, updateMember, deleteMember };
}
