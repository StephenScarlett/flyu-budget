"use client";

import type { Member } from "../../lib/supabase/types";

interface MemberFilterProps {
  members: Member[];
  selected: string | null;
  onChange: (id: string | null) => void;
}

export default function MemberFilter({ members, selected, onChange }: MemberFilterProps) {
  const activeMembers = members.filter((m) => m.is_active);
  if (activeMembers.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-gray-500 mr-1">Filter:</span>
      <button
        onClick={() => onChange(null)}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
          !selected ? "bg-sky-600 text-white" : "bg-[#222] text-gray-400 hover:text-gray-200"
        }`}
      >
        All
      </button>
      {activeMembers.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(selected === m.id ? null : m.id)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            selected === m.id ? "bg-sky-600 text-white" : "bg-[#222] text-gray-400 hover:text-gray-200"
          }`}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
}
