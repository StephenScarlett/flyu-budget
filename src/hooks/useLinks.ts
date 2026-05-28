"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import type { TripLink } from "../lib/supabase/types";

export function useLinks(tripId: string | undefined) {
  const [links, setLinks] = useState<TripLink[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!tripId) return;

    async function fetchLinks() {
      const { data } = await supabase
        .from("links")
        .select("*")
        .eq("trip_id", tripId!)
        .order("sort_order", { ascending: true });
      if (data) setLinks(data);
      setLoading(false);
    }

    fetchLinks();

    const channel = supabase
      .channel("links-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "links", filter: `trip_id=eq.${tripId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLinks((prev) => [...prev, payload.new as TripLink]);
          } else if (payload.eventType === "UPDATE") {
            setLinks((prev) =>
              prev.map((l) => (l.id === (payload.new as TripLink).id ? (payload.new as TripLink) : l))
            );
          } else if (payload.eventType === "DELETE") {
            setLinks((prev) => prev.filter((l) => l.id !== (payload.old as TripLink).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLink = useCallback(
    async (link: Omit<TripLink, "id" | "created_at">) => {
      const tempId = crypto.randomUUID();
      const optimistic = { ...link, id: tempId, created_at: new Date().toISOString() } as TripLink;
      setLinks((prev) => [...prev, optimistic]);
      const { data } = await supabase.from("links").insert(link as never).select().single();
      if (data) setLinks((prev) => prev.map((l) => (l.id === tempId ? (data as TripLink) : l)));
    },
    [supabase]
  );

  const updateLink = useCallback(
    async (id: string, updates: Partial<TripLink>) => {
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
      await supabase.from("links").update(updates as never).eq("id", id);
    },
    [supabase]
  );

  const deleteLink = useCallback(
    async (id: string) => {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      await supabase.from("links").delete().eq("id", id);
    },
    [supabase]
  );

  return { links, loading, addLink, updateLink, deleteLink };
}
