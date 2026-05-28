import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface BebbyAction {
  type: "add_item" | "update_item" | "delete_item" | "add_day" | "update_day" | "delete_day" | "add_link" | "delete_link";
  table: string;
  data?: Record<string, unknown>;
  id?: string;
  description: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const action: BebbyAction = body.action;

  if (!action || !action.type) {
    return NextResponse.json({ error: "Action required" }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    switch (action.type) {
      case "add_item": {
        const { error } = await supabase.from("budget_items").insert(action.data as never);
        if (error) throw error;
        break;
      }
      case "update_item": {
        if (!action.id) throw new Error("ID required for update");
        const { error } = await supabase.from("budget_items").update(action.data as never).eq("id", action.id);
        if (error) throw error;
        break;
      }
      case "delete_item": {
        if (!action.id) throw new Error("ID required for delete");
        const { error } = await supabase.from("budget_items").delete().eq("id", action.id);
        if (error) throw error;
        break;
      }
      case "add_day": {
        const { error } = await supabase.from("itinerary").insert(action.data as never);
        if (error) throw error;
        break;
      }
      case "update_day": {
        if (!action.id) throw new Error("ID required for update");
        const { error } = await supabase.from("itinerary").update(action.data as never).eq("id", action.id);
        if (error) throw error;
        break;
      }
      case "delete_day": {
        if (!action.id) throw new Error("ID required for delete");
        const { error } = await supabase.from("itinerary").delete().eq("id", action.id);
        if (error) throw error;
        break;
      }
      case "add_link": {
        const { error } = await supabase.from("links").insert(action.data as never);
        if (error) throw error;
        break;
      }
      case "delete_link": {
        if (!action.id) throw new Error("ID required for delete");
        const { error } = await supabase.from("links").delete().eq("id", action.id);
        if (error) throw error;
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Action execution error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
