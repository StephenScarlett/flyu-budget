"use client";

import { useState } from "react";
import type { Member } from "../../lib/supabase/types";
import { SlidersHorizontal } from "../../lib/icons";

interface MemberFilterProps {
  members: Member[];
  selected: string | null;
  onChange: (id: string | null) => void;
}

export default function MemberFilter({ members, selected, onChange }: MemberFilterProps) {
  const activeMembers = members.filter((m) => m.is_active);
  const [open, setOpen] = useState(false);
  if (activeMembers.length === 0) return null;

  const selectedName = selected ? activeMembers.find((m) => m.id === selected)?.name : null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
          selected
            ? "bg-sky-600/20 text-sky-400 border border-sky-600/40"
            : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-200"
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Filter</span>
        {selectedName && (
          <span className="bg-sky-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
            {selectedName}
          </span>
        )}
      </button>
      {open && (
        <div className="flex flex-wrap items-center gap-1.5 animate-fade-up" style={{ animationDuration: '150ms' }}>
          <button
            onClick={() => onChange(null)}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              !selected ? "bg-sky-600 text-white" : "bg-[#1a1a1a] text-gray-400 hover:text-gray-200"
            }`}
          >
            All
          </button>
          {activeMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => onChange(selected === m.id ? null : m.id)}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                selected === m.id ? "bg-sky-600 text-white" : "bg-[#1a1a1a] text-gray-400 hover:text-gray-200"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
