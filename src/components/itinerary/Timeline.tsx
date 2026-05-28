"use client";

import { useState } from "react";
import type { ItineraryDay } from "../../lib/supabase/types";
import { Calendar, CircleDollarSign, Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown } from "lucide-react";

interface TimelineProps {
  days: ItineraryDay[];
  tripId: string;
  onUpdate: (dayId: string, updates: Partial<ItineraryDay>) => Promise<void>;
  onAdd: (day: Omit<ItineraryDay, "id">) => Promise<void>;
  onDelete: (dayId: string) => Promise<void>;
  onSwap: (dayIdA: string, dayIdB: string) => Promise<void>;
}

export default function Timeline({ days, tripId, onUpdate, onAdd, onDelete, onSwap }: TimelineProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCost, setNewCost] = useState("");

  async function handleAdd() {
    if (!newTitle.trim()) return;
    const nextDay = days.length > 0 ? Math.max(...days.map((d) => d.day_number)) + 1 : 1;
    await onAdd({
      trip_id: tripId,
      day_number: nextDay,
      title: newTitle,
      description: newDesc || null,
      cost_note: newCost || null,
      sort_order: nextDay,
    });
    setNewTitle("");
    setNewDesc("");
    setNewCost("");
    setAdding(false);
  }

  return (
    <div className="space-y-4">
      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white inline-flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-400" />
          Itinerary
        </h3>
        <button
          onClick={() => setAdding(!adding)}
          className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-500 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Day
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-4 space-y-3 animate-fade-down">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Day title (e.g. Universal Studios)"
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-600"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description / plans for the day"
            rows={2}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-600"
          />
          <input
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
            placeholder="Cost note (optional)"
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-600"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-sky-600 text-white text-xs rounded-lg hover:bg-sky-500 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Add
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 bg-[#1a1a1a] text-gray-400 text-xs rounded-lg hover:bg-[#222] inline-flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Days */}
      {days.length === 0 ? (
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-8 text-center text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-lg mb-2">No itinerary days yet</p>
          <p className="text-sm">Click &ldquo;Add Day&rdquo; to start planning.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-sky-500 via-sky-400 to-sky-600 rounded-full" />

          <div className="space-y-0">
            {days.map((day, idx) => (
              <DayCard
                key={day.id}
                day={day}
                index={idx}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onMoveUp={idx > 0 ? () => onSwap(day.id, days[idx - 1].id) : undefined}
                onMoveDown={idx < days.length - 1 ? () => onSwap(day.id, days[idx + 1].id) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DayCard({
  day,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  day: ItineraryDay;
  index: number;
  onUpdate: (dayId: string, updates: Partial<ItineraryDay>) => Promise<void>;
  onDelete: (dayId: string) => Promise<void>;
  onMoveUp?: () => Promise<void>;
  onMoveDown?: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(day.title);
  const [description, setDescription] = useState(day.description || "");
  const [costNote, setCostNote] = useState(day.cost_note || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    await onUpdate(day.id, {
      title,
      description: description || null,
      cost_note: costNote || null,
    });
    setEditing(false);
  }

  function handleCancel() {
    setTitle(day.title);
    setDescription(day.description || "");
    setCostNote(day.cost_note || "");
    setEditing(false);
  }

  return (
    <div className="relative pl-12 pb-6 group animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      {/* Day number circle on the timeline */}
      <div className="absolute left-0 top-4 z-10">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#141414] border-2 border-sky-500 text-sky-300 text-sm font-bold shadow-lg shadow-sky-500/10">
          D{day.day_number}
        </span>
      </div>

      {/* Card */}
      <div className="bg-[#141414] rounded-xl border border-gray-800 hover:border-gray-700 transition-colors ml-4 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-semibold px-2 py-1 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white flex-1 focus:outline-none focus:border-sky-600"
              />
            ) : (
              <h3 className="text-base font-semibold text-white">{day.title}</h3>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              {editing ? (
                <>
                  <button onClick={handleSave} className="p-1.5 rounded hover:bg-[#222] text-emerald-400" title="Save">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={handleCancel} className="p-1.5 rounded hover:bg-[#222] text-gray-500" title="Cancel">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {onMoveUp && (
                    <button onClick={onMoveUp} className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all" title="Move up">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onMoveDown && (
                    <button onClick={onMoveDown} className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all" title="Move down">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onDelete(day.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500">Yes</button>
                      <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-xs bg-[#222] text-gray-400 rounded hover:bg-[#333]">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-2 mt-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's the plan for this day?"
                rows={2}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-600"
              />
              <input
                value={costNote}
                onChange={(e) => setCostNote(e.target.value)}
                placeholder="Cost note (e.g., 'Universal tickets included')"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-600"
              />
            </div>
          ) : (
            <>
              {day.description && (
                <p className="text-gray-400 text-sm mt-2">{day.description}</p>
              )}
              {day.cost_note && (
                <p className="text-xs text-sky-400 mt-2 bg-sky-950/50 inline-flex items-center gap-1 px-2 py-1 rounded">
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  {day.cost_note}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
