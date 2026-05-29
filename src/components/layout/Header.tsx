"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Trip } from "../../lib/supabase/types";
import { Pencil, Check, X } from "../../lib/icons";
import { MessageCircle } from "lucide-react";

interface HeaderProps {
  trip: Trip | null;
  onUpdate?: (updates: Partial<Trip>) => Promise<void>;
  onOpenChat?: () => void;
}

export default function Header({ trip, onUpdate, onOpenChat }: HeaderProps) {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(trip?.trip_start ?? "");
  const [end, setEnd] = useState(trip?.trip_end ?? "");
  const popoverRef = useRef<HTMLDivElement>(null);

  function openEdit() {
    setStart(trip?.trip_start ?? "");
    setEnd(trip?.trip_end ?? "");
    setEditing(true);
  }

  function calcNights(s: string, e: string): number {
    if (!s || !e) return trip?.num_nights ?? 6;
    const diff = Math.round((new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }

  async function save() {
    if (onUpdate) {
      await onUpdate({
        trip_start: start || null,
        trip_end: end || null,
        num_nights: calcNights(start, end),
      });
    }
    setEditing(false);
  }

  // Close popover on outside click
  useEffect(() => {
    if (!editing) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editing]);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD";
  const formatDateFull = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";

  return (
    <header className="bg-black border-b border-gray-800 text-white animate-fade-down relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="FLYU Nation"
              width={56}
              height={56}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                FLYU <span className="text-sky-300">Orlando 2027</span>
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                {trip?.destination ?? "Orlando, FL"} •{" "}
                {trip?.group_size ?? 7} travelers •{" "}
                {trip?.num_nights ?? 6} nights
              </p>
            </div>

            {/* Ask Bebby button */}
            <button
              onClick={onOpenChat}
              className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-gray-700 hover:border-sky-500 hover:bg-[#222] transition-all group"
              title="Ask Bebby"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src="/bebby.png"
                  alt="Bebby"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-sky-300 transition-colors hidden sm:inline">
                Ask Bebby
              </span>
              <MessageCircle className="w-3.5 h-3.5 text-gray-500 group-hover:text-sky-400 transition-colors" />
            </button>
          </div>

          {/* Trip details — editable */}
          <div className="text-right relative flex-shrink-0" ref={popoverRef}>
            <button onClick={openEdit} className="group text-right cursor-pointer" title="Click to edit trip details">
              <p className="text-xs text-gray-500 hidden sm:inline-flex items-center gap-1">
                Trip Dates
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xs sm:text-sm font-medium text-sky-300">
                {trip?.trip_start || trip?.trip_end ? (
                  <>
                    {formatDate(trip?.trip_start ?? null)} – {formatDateFull(trip?.trip_end ?? null)}
                  </>
                ) : (
                  <span className="text-gray-500 italic">Dates not set — click to edit</span>
                )}
              </p>
            </button>

            {/* Edit popover */}
            {editing && (
              <div className="fixed inset-0 z-50 bg-black/40 sm:bg-transparent sm:static sm:inset-auto flex items-center justify-center sm:block">
                <div className="bg-[#181818] border border-gray-700 rounded-xl shadow-2xl p-4 w-[90vw] max-w-[320px] sm:w-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:min-w-[280px] animate-fade-down" style={{ animationDuration: '200ms' }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 w-12 text-left">Start</label>
                    <input
                      type="date"
                      value={start ?? ""}
                      onChange={(e) => setStart(e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-[#222] border border-gray-700 rounded-lg text-xs text-gray-200 focus:border-sky-600 focus:outline-none cursor-text"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 w-12 text-left">End</label>
                    <input
                      type="date"
                      value={end ?? ""}
                      onChange={(e) => setEnd(e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-[#222] border border-gray-700 rounded-lg text-xs text-gray-200 focus:border-sky-600 focus:outline-none cursor-text"
                    />
                  </div>
                  {start && end && (
                    <p className="text-xs text-gray-500 text-center">
                      {calcNights(start, end)} nights
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-800">
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={save} className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-500 transition-colors cursor-pointer">
                    Save
                  </button>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
