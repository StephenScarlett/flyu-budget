"use client";

import { useState } from "react";
import {
  Plane,
  Home,
  Ticket,
  Zap,
  Car,
  ShoppingCart,
  ExternalLink,
  Link2,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Globe,
  type LucideIcon,
} from "lucide-react";
import type { TripLink } from "../../lib/supabase/types";

const ICON_MAP: Record<string, LucideIcon> = {
  plane: Plane,
  home: Home,
  ticket: Ticket,
  zap: Zap,
  car: Car,
  "shopping-cart": ShoppingCart,
  link: Link2,
  globe: Globe,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

interface LinksTabProps {
  links: TripLink[];
  tripId: string;
  onAdd: (link: Omit<TripLink, "id" | "created_at">) => Promise<void>;
  onUpdate: (id: string, updates: Partial<TripLink>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TipsTab({ links, tripId, onAdd, onUpdate, onDelete }: LinksTabProps) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", url: "", icon_name: "link" });

  function openAdd() {
    setForm({ label: "", url: "", icon_name: "link" });
    setEditId(null);
    setAdding(true);
  }

  function openEdit(link: TripLink) {
    setForm({ label: link.label, url: link.url, icon_name: link.icon_name });
    setEditId(link.id);
    setAdding(true);
  }

  async function handleSave() {
    if (!form.label.trim() || !form.url.trim()) return;
    if (editId) {
      await onUpdate(editId, { label: form.label, url: form.url, icon_name: form.icon_name });
    } else {
      await onAdd({ trip_id: tripId, label: form.label, url: form.url, icon_name: form.icon_name, sort_order: links.length });
    }
    setAdding(false);
    setEditId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white inline-flex items-center gap-2">
          <Link2 className="w-5 h-5 text-sky-400" />
          Booking &amp; Resources
        </h3>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-500 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Link
        </button>
      </div>

      {/* Add/Edit inline form */}
      {adding && (
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-4 mb-4 space-y-3 animate-fade-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Link label"
              className="px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-600"
            />
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {ICON_OPTIONS.map((name) => {
                const Ic = ICON_MAP[name];
                return (
                  <button
                    key={name}
                    onClick={() => setForm({ ...form, icon_name: name })}
                    className={`p-1.5 rounded ${form.icon_name === name ? "bg-sky-600 text-white" : "bg-[#1a1a1a] text-gray-500 hover:text-gray-300"}`}
                    title={name}
                  >
                    <Ic className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5 ml-auto">
              <button onClick={handleSave} className="px-3 py-1.5 bg-sky-600 text-white text-xs rounded-lg hover:bg-sky-500 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {editId ? "Update" : "Add"}
              </button>
              <button onClick={() => { setAdding(false); setEditId(null); }} className="px-3 py-1.5 bg-[#1a1a1a] text-gray-400 text-xs rounded-lg hover:bg-[#222] inline-flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Links grid */}
      <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
        {links.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            No links yet. Click &ldquo;Add Link&rdquo; to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {links.map((link, i) => {
              const Icon = ICON_MAP[link.icon_name] || Link2;
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-r border-gray-800 group hover:bg-[#1a1a1a] transition-colors animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Icon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-sky-400 group-hover:text-sky-300 transition-colors truncate flex-1"
                  >
                    {link.label}
                  </a>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-600 hover:text-sky-400">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button onClick={() => openEdit(link)} className="p-1 text-gray-600 hover:text-sky-400">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDelete(link.id)} className="p-1 text-gray-600 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
