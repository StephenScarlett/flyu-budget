"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import type { BudgetItem } from "../lib/supabase/types";

export function useBudgetItems(tripId: string | undefined) {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!tripId) return;

    async function fetchItems() {
      const { data } = await supabase
        .from("budget_items")
        .select("*")
        .eq("trip_id", tripId!)
        .order("sort_order", { ascending: true });
      if (data) setItems(data);
      setLoading(false);
    }

    fetchItems();

    const channel = supabase
      .channel("budget-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budget_items",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [...prev, payload.new as BudgetItem]);
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((item) =>
                item.id === (payload.new as BudgetItem).id
                  ? (payload.new as BudgetItem)
                  : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) =>
              prev.filter((item) => item.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = useCallback(
    async (itemId: string, updates: Partial<BudgetItem>) => {
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
      await supabase
        .from("budget_items")
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq("id", itemId);
    },
    [supabase]
  );

  const addItem = useCallback(
    async (item: Omit<BudgetItem, "id" | "created_at" | "updated_at" | "updated_by">) => {
      const tempId = crypto.randomUUID();
      const optimistic = { ...item, id: tempId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), updated_by: null } as BudgetItem;
      setItems((prev) => [...prev, optimistic]);
      const { data } = await supabase.from("budget_items").insert(item as never).select().single();
      if (data) setItems((prev) => prev.map((i) => (i.id === tempId ? (data as BudgetItem) : i)));
    },
    [supabase]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      await supabase.from("budget_items").delete().eq("id", itemId);
    },
    [supabase]
  );

  return { items, loading, updateItem, addItem, deleteItem };
}
