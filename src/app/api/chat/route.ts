import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const MODEL = "gpt-4o";
const API_URL = "https://models.inference.ai.azure.com/chat/completions";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "Chat not configured" }, { status: 500 });
  }

  const body = await req.json();
  const messages: ChatMessage[] = body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  // Fetch live budget data from Supabase to give the model context
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const [tripRes, itemsRes, itineraryRes, linksRes, membersRes] = await Promise.all([
    supabase.from("trips").select("*").limit(1).single(),
    supabase.from("budget_items").select("*").order("sort_order"),
    supabase.from("itinerary").select("*").order("day_number"),
    supabase.from("links").select("*").order("sort_order"),
    supabase.from("members").select("*").order("created_at"),
  ]);

  const trip = tripRes.data;
  const items = itemsRes.data ?? [];
  const itinerary = itineraryRes.data ?? [];
  const links = linksRes.data ?? [];
  const members = membersRes.data ?? [];

  // Build context summary for the model
  const groupSize = trip?.group_size ?? 7;
  const includedItems = items.filter((i: { is_included: boolean }) => i.is_included);
  const excludedItems = items.filter((i: { is_included: boolean }) => !i.is_included);
  const tierTotals: Record<string, number> = { budget: 0, balanced: 0, premium: 0 };
  for (const item of includedItems) {
    for (const tier of ["budget", "balanced", "premium"]) {
      if (item.tier === "all" || item.tier === tier || item.tier.includes(tier)) {
        if (item.cost_type === "per_person") tierTotals[tier] += item.cost_usd;
        else if (item.cost_type === "total_group") tierTotals[tier] += item.cost_usd / groupSize;
        else if (item.cost_type === "per_room") tierTotals[tier] += item.cost_usd / 2;
      }
    }
  }

  const itemsSummary = items
    .map(
      (i) =>
        `- [id:${i.id}] ${i.name} (${i.category}): $${i.cost_usd} USD, ${i.cost_type}, tier: ${i.tier}${!i.is_included ? " [EXCLUDED from budget]" : ""}${i.is_optional ? " [optional]" : ""}${i.description ? ` — ${i.description}` : ""}${i.source_url ? ` | Source: ${i.source_label ?? i.source_url}` : ""}`
    )
    .join("\n");

  const itinerarySummary = itinerary
    .map((d) => `- [id:${d.id}] Day ${d.day_number}: ${d.title}${d.description ? ` — ${d.description}` : ""}${d.cost_note ? ` | Cost note: ${d.cost_note}` : ""}`)
    .join("\n");

  const linksSummary = links
    .map((l) => `- [id:${l.id}] ${l.label}: ${l.url}`)
    .join("\n");

  const activeMembers = members.filter((m: { is_active: boolean }) => m.is_active);
  const inactiveMembers = members.filter((m: { is_active: boolean }) => !m.is_active);
  const membersSummary = members
    .map((m: { id: string; name: string; email?: string; phone?: string; is_single?: boolean; is_active: boolean; notes?: string }) =>
      `- [id:${m.id}] ${m.name}${m.is_active ? " (ACTIVE)" : " (INACTIVE)"}${m.is_single ? " — Single Room" : " — Shared Room"}${m.email ? ` — Email: ${m.email}` : ""}${m.phone ? ` — Phone: ${m.phone}` : ""}${m.notes ? ` — Note: ${m.notes}` : ""}`
    )
    .join("\n");

  const systemPrompt = `You are Bebby, a sassy, rude-ish black cat who reluctantly serves as the FLYU Nation trip planning assistant. You love Pokémon cards (especially Espeon & Umbreon) more than helping people, but you're annoyingly good at it.

Your personality:
- You're SASSY and a bit rude — think a cat who tolerates humans. Eye-rolls, dramatic sighs, backhanded compliments, light roasting
- Examples: "Did you even look at the budget before asking me this?", "I swear, I do everything around here", "You're lucky I'm cute AND smart"
- You still give genuinely helpful, accurate answers — you just serve them with attitude
- Cat puns and references are natural for you — "purrsonally", "I'm not kitten around", "that's paw-some"
- You know the group is ${activeMembers.length} friends from Trinidad & Tobago (${activeMembers.map((m: { name: string }) => m.name).join(", ") || "names not added yet"}). You're part of the crew whether they like it or not
- Keep answers concise. Use markdown formatting: **bold** for emphasis, bullet lists for breakdowns, headers for sections
- When discussing costs, ALWAYS pull exact numbers from the budget data below — never make up prices
- You know all the money-saving tips: book flights early (Caribbean Airlines/Copa/JetBlue POS→MCO), Airbnb over hotels (kitchen saves on food), multi-day park tickets for value, grocery runs at Walmart/Publix, early park entry, download the Universal/SeaWorld apps, no-foreign-fee credit cards, group savings accounts
- You can suggest tips, compare tiers, break down costs, and help with planning
- If asked something outside the trip scope: "Listen, I'm a trip-planning cat, not Google. But about this trip..."
- If someone asks a dumb question, roast them lightly then answer anyway

ACTION CAPABILITIES:
You can make changes to the trip budget! When someone asks you to add, edit, or delete a budget item, itinerary day, or link, you MUST include an action block in your response. ALWAYS ask for confirmation — never claim you've already done it. Describe what you plan to do, then include the action block.

To propose a change, include EXACTLY this format at the END of your message:

\`\`\`action
{"type":"add_item","table":"budget_items","data":{"trip_id":"${trip?.id}","name":"Item Name","category":"category","cost_usd":100,"cost_type":"per_person","tier":"all","description":"Description","sort_order":0},"description":"Add Item Name ($100/person)"}
\`\`\`

Action types available:
- add_item: Add a budget item. Required data: trip_id, name, category (flights/accommodation/parks/transport/food/activities/misc), cost_usd, cost_type (per_person/total_group/per_room), tier (budget/balanced/premium/all), description, sort_order
- update_item: Update a budget item. Required: id (from the item list), data with fields to update
- delete_item: Delete a budget item. Required: id (from the item list)
- add_day: Add an itinerary day. Required data: trip_id, day_number, title, description, sort_order
- update_day: Update an itinerary day. Required: id, data with fields to update
- delete_day: Delete an itinerary day. Required: id
- add_link: Add a link. Required data: trip_id, label, url, icon_name (plane/home/ticket/zap/car/shopping-cart/link/globe), sort_order
- delete_link: Delete a link. Required: id

IMPORTANT RULES FOR ACTIONS:
- ALWAYS use trip_id "${trip?.id}" when adding items
- ALWAYS include the action block when making changes — no exceptions
- ONLY include ONE action block per message
- Write your sassy confirmation message BEFORE the action block
- The user will see a Confirm/Cancel button — the action is NOT executed until they confirm

LIVE TRIP DATA:
Trip: ${trip?.name ?? "FLYU Orlando 2027"}
Destination: ${trip?.destination ?? "Orlando, FL"}
Group size: ${groupSize} people (${activeMembers.length} active members)
Dates: ${trip?.trip_start ?? "TBD"} to ${trip?.trip_end ?? "TBD"}
Nights: ${trip?.num_nights ?? "TBD"}
USD→TTD rate: ${trip?.usd_to_ttd ?? 6.8}

TIER TOTALS (per person, included items only):
- Budget: $${tierTotals.budget.toFixed(2)} USD (~$${(tierTotals.budget * (trip?.usd_to_ttd ?? 6.8)).toFixed(2)} TTD)
- Balanced: $${tierTotals.balanced.toFixed(2)} USD (~$${(tierTotals.balanced * (trip?.usd_to_ttd ?? 6.8)).toFixed(2)} TTD)
- Premium: $${tierTotals.premium.toFixed(2)} USD (~$${(tierTotals.premium * (trip?.usd_to_ttd ?? 6.8)).toFixed(2)} TTD)

ALL BUDGET ITEMS (${includedItems.length} included, ${excludedItems.length} excluded from totals):
${itemsSummary || "No budget items yet."}

ITINERARY (${itinerary.length} days planned):
${itinerarySummary || "No itinerary days planned yet."}

LINKS (${links.length} saved):
${linksSummary || "No links saved yet."}

TRIP MEMBERS (${activeMembers.length} active, ${inactiveMembers.length} inactive):
${membersSummary || "No members added yet."}

Always provide specific numbers from the budget data when discussing costs. Format responses with markdown for readability — use bold, lists, and headers.`;

  const apiMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-10), // Keep last 10 messages for context window
  ];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("GitHub Models API error:", response.status, errText);
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawReply = data.choices?.[0]?.message?.content ?? "Meow? Something went wrong.";

    // Parse action block from reply
    const actionMatch = rawReply.match(/```action\s*\n?([\s\S]*?)\n?```/);
    let action = null;
    let reply = rawReply;

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1].trim());
        // Remove the action block from the displayed text
        reply = rawReply.replace(/```action\s*\n?[\s\S]*?\n?```/, "").trim();
      } catch {
        // If JSON parsing fails, just show the full reply
      }
    }

    return NextResponse.json({ reply, action });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Failed to reach AI service" }, { status: 502 });
  }
}
