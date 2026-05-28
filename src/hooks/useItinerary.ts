"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import type { ItineraryDay } from "../lib/supabase/types";

export function useItinerary(tripId: string | undefined) {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!tripId) return;

    async function fetchDays() {
      const { data } = await supabase
        .from("itinerary")
        .select("*")
        .eq("trip_id", tripId!)
        .order("day_number", { ascending: true });
      if (data) setDays(data);
      setLoading(false);
    }

    fetchDays();

    const channel = supabase
      .channel("itinerary-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "itinerary",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDays((prev) => [...prev, payload.new as ItineraryDay].sort((a, b) => a.day_number - b.day_number));
          } else if (payload.eventType === "UPDATE") {
            setDays((prev) =>
              prev.map((day) =>
                day.id === (payload.new as ItineraryDay).id
                  ? (payload.new as ItineraryDay)
                  : day
              )
            );
          } else if (payload.eventType === "DELETE") {
            setDays((prev) => prev.filter((d) => d.id !== (payload.old as ItineraryDay).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDay = useCallback(
    async (dayId: string, updates: Partial<ItineraryDay>) => {
      setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...updates } : d)));
      await supabase.from("itinerary").update(updates as never).eq("id", dayId);
    },
    [supabase]
  );

  const addDay = useCallback(
    async (day: Omit<ItineraryDay, "id">) => {
      const tempId = crypto.randomUUID();
      const optimistic = { ...day, id: tempId } as ItineraryDay;
      setDays((prev) => [...prev, optimistic].sort((a, b) => a.day_number - b.day_number));
      const { data } = await supabase.from("itinerary").insert(day as never).select().single();
      if (data) setDays((prev) => prev.map((d) => (d.id === tempId ? (data as ItineraryDay) : d)));
    },
    [supabase]
  );

  const deleteDay = useCallback(
    async (dayId: string) => {
      setDays((prev) => prev.filter((d) => d.id !== dayId));
      await supabase.from("itinerary").delete().eq("id", dayId);
    },
    [supabase]
  );

  const swapDays = useCallback(
    async (dayIdA: string, dayIdB: string) => {
      const a = days.find((d) => d.id === dayIdA);
      const b = days.find((d) => d.id === dayIdB);
      if (!a || !b) return;

      // Optimistic swap
      setDays((prev) =>
        prev
          .map((d) => {
            if (d.id === dayIdA) return { ...d, day_number: b.day_number, sort_order: b.sort_order };
            if (d.id === dayIdB) return { ...d, day_number: a.day_number, sort_order: a.sort_order };
            return d;
          })
          .sort((x, y) => x.day_number - y.day_number)
      );

      await Promise.all([
        supabase.from("itinerary").update({ day_number: b.day_number, sort_order: b.sort_order } as never).eq("id", dayIdA),
        supabase.from("itinerary").update({ day_number: a.day_number, sort_order: a.sort_order } as never).eq("id", dayIdB),
      ]);
    },
    [supabase, days]
  );

  return { days, loading, updateDay, addDay, deleteDay, swapDays };
}
