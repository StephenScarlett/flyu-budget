"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import type { Trip } from "../lib/supabase/types";

export function useTrip(tripId?: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTrip() {
      const query = supabase.from("trips").select("*");
      const { data } = tripId
        ? await query.eq("id", tripId).single()
        : await query.limit(1).single();
      if (data) setTrip(data);
      setLoading(false);
    }

    fetchTrip();

    const channel = supabase
      .channel("trip-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setTrip((prev) =>
              prev && prev.id === (payload.new as Trip).id
                ? (payload.new as Trip)
                : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTrip = useCallback(
    async (updates: Partial<Trip>) => {
      if (!trip) return;
      const { data } = await supabase
        .from("trips")
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq("id", trip.id)
        .select()
        .single();
      if (data) setTrip(data);
    },
    [trip, supabase]
  );

  return { trip, loading, updateTrip };
}
