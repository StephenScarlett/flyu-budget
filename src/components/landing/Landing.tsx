"use client";

import { useState } from "react";
import Image from "next/image";
import type { Member } from "../../lib/supabase/types";

/**
 * Photo map — each entry positions a hover zone over a person in the group photo.
 * Coordinates are percentages of the image dimensions.
 * Easily swappable if the photo changes.
 */
const PHOTO_MAP: { name: string; x: number; y: number; w: number; h: number }[] = [
  { name: "Kiran",     x: 26, y: 41, w: 12, h: 28 },
  { name: "Stephen",   x: 38, y: 44, w: 8, h: 20 },
  { name: "Shania",    x: 40, y: 63, w: 12, h: 36 },
  { name: "Tyler",     x: 45, y: 14, w: 9, h: 26 },
  { name: "Cameron",   x: 56, y: 22, w: 9, h: 26 },
  { name: "Zachary",   x: 66, y: 17, w: 17, h: 61 },
];

interface LandingProps {
  members: Member[];
  onEnter: () => void;
  onMemberClick: (memberId: string) => void;
}

export default function Landing({ members, onEnter, onMemberClick }: LandingProps) {
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  function findMember(displayName: string): Member | undefined {
    const lower = displayName.toLowerCase();
    return members.find(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.name.toLowerCase().split(" ")[0] === lower
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-sky-600/5 blur-[80px]" />
        </div>

        {/* Logo + Title */}
        <div className="text-center mb-8 animate-fade-down relative z-10">
          <Image
            src="/logo.png"
            alt="FLYU Nation"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-xl"
          />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            FLYU <span className="text-sky-300">Orlando 2027</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2 tracking-widest uppercase">
            Outpace &bull; Outplay
          </p>
        </div>

        {/* Group Photo with hover zones */}
        <div className="relative w-full max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: "200ms" }}>
          {/* Photo container */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-sky-900/10">
            {/* Dark overlay that intensifies when someone is hovered */}
            <div
              className={`absolute inset-0 z-10 transition-colors duration-300 pointer-events-none ${
                hoveredName ? "bg-black/50" : "bg-black/20"
              }`}
            />

            <Image
              src="/group.jpg"
              alt="The FLYU Crew"
              width={1280}
              height={720}
              className="w-full h-auto"
              priority
            />

            {/* Hover zones */}
            {PHOTO_MAP.map((zone) => {
              const member = findMember(zone.name);
              const isHovered = hoveredName === zone.name;

              return (
                <button
                  key={zone.name}
                  className="absolute z-20 transition-all duration-300 rounded-lg cursor-pointer group"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.w}%`,
                    height: `${zone.h}%`,
                  }}
                  onMouseEnter={() => setHoveredName(zone.name)}
                  onMouseLeave={() => setHoveredName(null)}
                  onClick={() => member && onMemberClick(member.id)}
                  title={member?.name ?? zone.name}
                >
                  {/* Highlight effect */}
                  <div
                    className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                      isHovered
                        ? "ring-2 ring-sky-400/60 bg-sky-400/10 shadow-lg shadow-sky-500/20"
                        : ""
                    }`}
                  />

                  {/* Name label */}
                  <div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0 transition-all duration-300 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <span className="bg-black/80 backdrop-blur-sm text-sky-300 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap border border-sky-500/30">
                      {member?.name ?? zone.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hovered member indicator below photo */}
          <div className="h-8 mt-3 text-center">
            {hoveredName && (
              <p className="text-sm text-gray-400 animate-fade-in" style={{ animationDuration: "150ms" }}>
                Click to view <span className="text-sky-300 font-medium">{findMember(hoveredName)?.name ?? hoveredName}</span>&apos;s profile
              </p>
            )}
          </div>
        </div>

        {/* Enter button */}
        <div className="mt-6 animate-fade-up relative z-10" style={{ animationDelay: "400ms" }}>
          <button
            onClick={onEnter}
            className="group px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-600/20 hover:shadow-sky-500/30 hover:scale-105 active:scale-95"
          >
            Let&apos;s Plan This Trip
            <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* Member count */}
        <p className="text-gray-600 text-xs mt-4 animate-fade-up relative z-10" style={{ animationDelay: "500ms" }}>
          {members.filter((m) => m.is_active).length} travelers &bull; Orlando, FL &bull; February 2027
        </p>
      </div>
    </div>
  );
}
