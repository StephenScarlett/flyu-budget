"use client";

import { useState } from "react";
import Image from "next/image";
import type { Member } from "../../lib/supabase/types";

interface LandingProps {
  members: Member[];
  onEnter: () => void;
  onMemberClick: (memberId: string) => void;
}

export default function Landing({ members, onEnter, onMemberClick }: LandingProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeMembers = members.filter((m) => m.is_active);
  const selectedMember = activeMembers.find((m) => m.id === selectedId);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-sky-600/5 blur-[80px]" />
        </div>

        {/* Logo + Title */}
        <div className="text-center mb-6 animate-fade-down relative z-10">
          <Image
            src="/logo.png"
            alt="FLYU Nation"
            width={64}
            height={64}
            className="mx-auto mb-3 rounded-xl"
          />
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Select Your <span className="text-sky-300">Traveler</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1.5 tracking-widest uppercase">
            FLYU Orlando 2027 &bull; Outpace &bull; Outplay
          </p>
        </div>

        {/* Main select area */}
        <div className="relative z-10 w-full max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: "150ms" }}>
          {/* Selected member preview — shows enlarged portrait + name above grid */}
          <div className="flex items-center justify-center mb-4 h-20 sm:h-24">
            {selectedMember ? (
              <div className="flex items-center gap-4 animate-fade-in" style={{ animationDuration: "200ms" }}>
                {/* Large portrait */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-sky-400 shadow-lg shadow-sky-500/30">
                  {selectedMember.avatar_url ? (
                    <Image
                      src={selectedMember.avatar_url}
                      alt={selectedMember.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-500">
                        {selectedMember.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                {/* Name + info */}
                <div>
                  <p className="text-xl sm:text-2xl font-black text-sky-300 uppercase tracking-wide">
                    {selectedMember.name}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
                    {selectedMember.is_single ? "Solo Room" : "Shared Room"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm animate-pulse">Choose a traveler below</p>
            )}
          </div>

          {/* Character grid — the MK-style roster */}
          <div className="relative rounded-xl border border-gray-800 bg-[#0d0d0d] p-3 sm:p-4 shadow-2xl shadow-sky-900/10">
            {/* Scanline overlay effect */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none opacity-[0.03] z-20"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
              }}
            />

            <div
              className="grid gap-2 sm:gap-3"
              style={{
                gridTemplateColumns: `repeat(${Math.min(activeMembers.length, activeMembers.length <= 4 ? activeMembers.length : Math.ceil(activeMembers.length / 2))}, minmax(0, 1fr))`,
              }}
            >
              {activeMembers.map((member, i) => {
                const isSelected = selectedId === member.id;

                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedId(member.id);
                      onMemberClick(member.id);
                    }}
                    onMouseEnter={() => setSelectedId(member.id)}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden cursor-pointer
                      transition-all duration-150 group animate-fade-up
                      ${isSelected
                        ? "ring-2 ring-sky-400 shadow-lg shadow-sky-500/30 scale-105 z-10"
                        : "ring-1 ring-gray-700/50 hover:ring-sky-500/50"
                      }
                      ${selectedId && !isSelected ? "brightness-50" : ""}
                    `}
                    style={{ animationDelay: `${200 + i * 60}ms` }}
                  >
                    {/* Avatar image */}
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.name}
                        fill
                        className={`object-cover transition-transform duration-200 ${
                          isSelected ? "scale-110" : "group-hover:scale-105"
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center">
                        <span className="text-2xl sm:text-4xl font-black text-gray-500 group-hover:text-gray-400 transition-colors">
                          {member.name[0]}
                        </span>
                      </div>
                    )}

                    {/* Dark gradient at bottom for name */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                    {/* Name label */}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2">
                      <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center truncate transition-colors ${
                        isSelected ? "text-sky-300" : "text-gray-300"
                      }`}>
                        {member.name.split(" ")[0]}
                      </p>
                    </div>

                    {/* Selection corner brackets */}
                    {isSelected && (
                      <>
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sky-400" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-sky-400" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-sky-400" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sky-400" />
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hint */}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-600 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
              </svg>
              select to view profile
            </p>
          </div>
        </div>

        {/* Enter button */}
        <div className="mt-6 animate-fade-up relative z-10" style={{ animationDelay: "500ms" }}>
          <button
            onClick={onEnter}
            className="group px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-600/20 hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
          >
            Let&apos;s Plan This Trip
            <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
          </button>
        </div>

        {/* Member count */}
        <p className="text-gray-600 text-xs mt-3 animate-fade-up relative z-10" style={{ animationDelay: "600ms" }}>
          {activeMembers.length} travelers &bull; Orlando, FL &bull; February 2027
        </p>
      </div>
    </div>
  );
}
