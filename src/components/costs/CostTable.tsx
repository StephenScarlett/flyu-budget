"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import type { BudgetItem } from "../../lib/supabase/types";
import type { Member } from "../../lib/supabase/types";
import { CATEGORIES, CATEGORY_MAP } from "../../lib/constants";
import { formatUSD } from "../../lib/calculations";
import {
  CATEGORY_ICONS,
  COST_TYPE_ICONS,
  Trash2,
  Plus,
  X,
  Pencil,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Users,
  BedDouble,
} from "../../lib/icons";

interface CostTableProps {
  items: BudgetItem[];
  members: Member[];
  onUpdate: (itemId: string, updates: Partial<BudgetItem>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onAdd: (item: Omit<BudgetItem, "id" | "created_at" | "updated_at" | "updated_by">) => Promise<void>;
  tripId: string;
}

const TIER_OPTIONS = [
  { value: "all", label: "All Tiers" },
  { value: "budget", label: "Budget" },
  { value: "balanced", label: "Balanced" },
  { value: "premium", label: "Premium" },
  { value: "budget,balanced", label: "Budget + Balanced" },
  { value: "balanced,premium", label: "Balanced + Premium" },
];

const COST_TYPE_OPTIONS = [
  { value: "per_person", label: "Per Member" },
  { value: "split_between", label: "Split Between" },
  { value: "total_group", label: "Group Total" },
];

type SortField = "category" | "name" | "description" | "cost_usd" | "cost_type" | "tier" | "source_label";

const PAGE_SIZE = 15;

const EMPTY_ITEM = {
  category: "flights",
  name: "",
  description: "",
  cost_usd: 0,
  cost_type: "per_person" as BudgetItem["cost_type"],
  tier: "all",
  source_label: "",
  source_url: "",
  is_optional: false,
  is_included: true,
  member_ids: null as string[] | null,
  package_categories: null as string[] | null,
};

/* ─── Modal ─── */
function ItemModal({
  mode,
  initial,
  members,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  initial: typeof EMPTY_ITEM;
  members: Member[];
  onSave: (data: typeof EMPTY_ITEM) => void;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const activeMembers = members.filter((m) => m.is_active);
  const activeMemberIds = new Set(activeMembers.map((m) => m.id));

  // Clean stale member_ids (members who were deactivated since assignment)
  const [form, setForm] = useState(() => {
    if (initial.member_ids && initial.member_ids.length > 0) {
      const cleaned = initial.member_ids.filter((id) => activeMemberIds.has(id));
      return { ...initial, member_ids: cleaned.length > 0 ? cleaned : null };
    }
    return initial;
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop"
    >
      <div className="bg-[#181818] border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {mode === "add" ? (
              <Plus className="w-5 h-5 text-sky-400" />
            ) : (
              <Pencil className="w-5 h-5 text-sky-400" />
            )}
            {mode === "add" ? "Add Budget Item" : "Edit Budget Item"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Category + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setForm({
                    ...form,
                    category: newCat,
                    package_categories: newCat === "package" ? form.package_categories : null,
                  });
                }}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-sky-600 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Item Name *</label>
              <input
                placeholder="e.g. Park tickets"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-sky-600 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Package Categories — only for Package category */}
          {form.category === "package" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Included Categories</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter((c) => c.key !== "package").map((cat) => {
                  const selected = form.package_categories?.includes(cat.key) ?? false;
                  const Icon = CATEGORY_ICONS[cat.key];
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        const current = form.package_categories ?? [];
                        const updated = selected
                          ? current.filter((k) => k !== cat.key)
                          : [...current, cat.key];
                        setForm({ ...form, package_categories: updated.length === 0 ? null : updated });
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                        selected
                          ? "bg-sky-600 text-white"
                          : "bg-[#222] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Description</label>
            <input
              placeholder="Brief description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-sky-600 focus:outline-none"
            />
          </div>

          {/* Cost + Type + Tier */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Cost (USD) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.cost_usd || ""}
                onChange={(e) => setForm({ ...form, cost_usd: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 font-mono focus:border-sky-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Cost Type</label>
              <select
                value={form.cost_type}
                onChange={(e) => {
                  const newType = e.target.value as BudgetItem["cost_type"];
                  setForm({
                    ...form,
                    cost_type: newType,
                    member_ids: (newType === "per_person" || newType === "split_between") ? form.member_ids : null,
                  });
                }}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-sky-600 focus:outline-none"
              >
                {COST_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Tier</label>
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-sky-600 focus:outline-none"
              >
                {TIER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Assignment — only for Per Member and Split Between cost types */}
          {(form.cost_type === "per_person" || form.cost_type === "split_between") && activeMembers.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Applies To</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, member_ids: null })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    !form.member_ids || form.member_ids.length === 0
                      ? "bg-sky-600 text-white"
                      : "bg-[#222] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200"
                  }`}
                >
                  Everyone
                </button>
                {activeMembers.map((m) => {
                  const selected = form.member_ids?.includes(m.id) ?? false;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        const current = form.member_ids ?? [];
                        const updated = selected
                          ? current.filter((id) => id !== m.id)
                          : [...current, m.id];
                        setForm({ ...form, member_ids: updated.length === 0 ? null : updated });
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selected
                          ? "bg-sky-600 text-white"
                          : "bg-[#222] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
              {form.member_ids && form.member_ids.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {form.member_ids.length} of {activeMembers.length} members selected
                </p>
              )}
            </div>
          )}

          {/* Source Label + URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Source Label</label>
              <input
                placeholder="e.g. Google Flights"
                value={form.source_label}
                onChange={(e) => setForm({ ...form, source_label: e.target.value })}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-sky-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Source URL</label>
              <input
                placeholder="https://..."
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-sky-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional */}
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_optional}
              onChange={(e) => setForm({ ...form, is_optional: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-[#222] text-sky-500 focus:ring-sky-500"
            />
            Optional item
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {mode === "add" ? "Add Item" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirmation Modal ─── */
function DeleteModal({
  itemName,
  onConfirm,
  onClose,
}: {
  itemName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop"
    >
      <div className="bg-[#181818] border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-950/60 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Delete Item</h3>
          </div>
          <p className="text-sm text-gray-400">
            Are you sure you want to delete <span className="text-white font-medium">&ldquo;{itemName}&rdquo;</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sort Header ─── */
function SortHeader({
  label,
  field,
  currentField,
  asc,
  onSort,
  className = "",
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  asc: boolean;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const active = currentField === field;
  return (
    <th
      className={`px-3 py-3 font-medium text-gray-400 cursor-pointer hover:text-gray-200 whitespace-nowrap select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          asc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />
        )}
      </span>
    </th>
  );
}

/* ─── Main CostTable ─── */
export default function CostTable({ items, members, onUpdate, onDelete, onAdd, tripId }: CostTableProps) {
  const [filter, setFilter] = useState<string>("all");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("category");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const baseItems = showActiveOnly ? items.filter((i) => i.is_included) : items;
  const filtered = filter === "all"
    ? baseItems
    : baseItems.filter(
        (i) =>
          i.category === filter ||
          (i.category === "package" && i.package_categories?.includes(filter))
      );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortField === "cost_usd") return (a.cost_usd - b.cost_usd) * dir;
    const aVal = String(a[sortField] ?? "");
    const bVal = String(b[sortField] ?? "");
    return aVal.localeCompare(bVal) * dir;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [filter, showActiveOnly]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  }

  const handleAdd = useCallback(async (data: typeof EMPTY_ITEM) => {
    await onAdd({
      ...data,
      trip_id: tripId,
      cost_usd: Number(data.cost_usd),
      sort_order: items.length,
      is_optional: data.is_optional,
      is_included: data.is_included,
      member_ids: data.member_ids,
      package_categories: data.package_categories,
    });
    setShowAddModal(false);
  }, [onAdd, tripId, items.length]);

  const handleEdit = useCallback(async (data: typeof EMPTY_ITEM) => {
    if (!editItem) return;
    await onUpdate(editItem.id, {
      category: data.category,
      name: data.name,
      description: data.description || null,
      cost_usd: Number(data.cost_usd),
      cost_type: data.cost_type,
      tier: data.tier,
      source_label: data.source_label || null,
      source_url: data.source_url || null,
      is_optional: data.is_optional,
      member_ids: data.member_ids,
      package_categories: data.package_categories,
    });
    setEditItem(null);
  }, [editItem, onUpdate]);

  const tierLabel = (t: string) => TIER_OPTIONS.find((o) => o.value === t)?.label ?? t;
  const costTypeLabel = (t: string) => COST_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
  const CostTypeIcon = (t: string) => COST_TYPE_ICONS[t] || User;

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 flex-shrink-0 animate-fade-up">
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-sky-600 text-white"
                : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-200"
            }`}
          >
            All ({baseItems.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = baseItems.filter(
              (i) =>
                i.category === cat.key ||
                (i.category === "package" && i.package_categories?.includes(cat.key))
            ).length;
            const Icon = CATEGORY_ICONS[cat.key];
            return (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                  filter === cat.key
                    ? "bg-sky-600 text-white"
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 ${
              showActiveOnly
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40"
                : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-200"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Active Only
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-500 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Table Container — scrollable body, sticky header */}
      <div className="bg-[#141414] rounded-xl border border-gray-800 flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1a1a1a]">
                <SortHeader label="Category" field="category" currentField={sortField} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Item" field="name" currentField={sortField} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Description" field="description" currentField={sortField} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Cost (USD)" field="cost_usd" currentField={sortField} asc={sortAsc} onSort={handleSort} className="text-right" />
                <SortHeader label="Type" field="cost_type" currentField={sortField} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Tier" field="tier" currentField={sortField} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Source" field="source_label" currentField={sortField} asc={sortAsc} onSort={handleSort} />
                <th className="px-3 py-3 font-medium text-gray-400 w-24 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No items found. Click &ldquo;Add Item&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const CatIcon = CATEGORY_ICONS[item.category];
                  const TypeIcon = CostTypeIcon(item.cost_type);
                  const isExpanded = expandedRow === item.id;
                  return (
                    <Fragment key={item.id}>
                    <tr className={`group animate-fade-up transition-opacity duration-150 ${item.is_included ? 'hover:bg-[#1a1a1a]/60' : 'opacity-40 hover:bg-[#1a1a1a]/30'}`} style={{ animationDelay: `${120 + idx * 30}ms` }}>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs text-gray-400 cursor-default"
                          title={
                            item.category === "package" && item.package_categories?.length
                              ? `Includes: ${item.package_categories.map((k) => CATEGORY_MAP[k as keyof typeof CATEGORY_MAP]?.label ?? k).join(", ")}`
                              : undefined
                          }
                        >
                          {CatIcon && <CatIcon className="w-3.5 h-3.5 text-sky-400" />}
                          {CATEGORY_MAP[item.category as keyof typeof CATEGORY_MAP]?.label ?? item.category}
                        </span>
                        {item.category === "package" && item.package_categories && item.package_categories.length > 0 && (
                          <p className="text-[10px] text-sky-400/70 mt-0.5">
                            {item.package_categories.length} {item.package_categories.length === 1 ? "category" : "categories"}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-100 min-w-[180px]">
                        {item.name}
                      </td>
                      <td
                        className="px-3 py-2.5 text-gray-500 text-xs max-w-[220px] cursor-pointer"
                        title={item.description || undefined}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                      >
                        {item.description ? (
                          <span className={isExpanded ? "whitespace-pre-wrap" : "line-clamp-1"}>{item.description}</span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm text-gray-200">
                        {formatUSD(item.cost_usd)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <TypeIcon className="w-3.5 h-3.5 text-gray-500" />
                          {costTypeLabel(item.cost_type)}
                        </span>
                        {(item.cost_type === "per_person" || item.cost_type === "split_between") && item.member_ids && item.member_ids.length > 0 && (
                          <p
                            className="text-[10px] text-sky-400/70 mt-0.5 cursor-default"
                            title={item.member_ids.map((id) => members.find((m) => m.id === id)?.name ?? id).join(", ")}
                          >
                            {item.member_ids.length === 1
                              ? members.find((m) => m.id === item.member_ids![0])?.name ?? "1 member"
                              : `${item.member_ids.length} members`}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.tier === "all"
                              ? "bg-gray-800 text-gray-300"
                              : item.tier.includes("premium")
                              ? "bg-amber-950/60 text-amber-400"
                              : item.tier.includes("balanced")
                              ? "bg-sky-950/60 text-sky-300"
                              : "bg-emerald-950/60 text-emerald-400"
                          }`}
                        >
                          {tierLabel(item.tier)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {item.source_url ? (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {item.source_label || "Link"}
                          </a>
                        ) : (
                          <span className="text-gray-500">{item.source_label || "—"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onUpdate(item.id, { is_included: !item.is_included })}
                            className="group/toggle flex items-center gap-1 cursor-pointer"
                            title={item.is_included ? "Exclude from trip budget" : "Include in trip budget"}
                          >
                            <div className={`relative w-7 h-4 rounded-full transition-colors duration-150 ${
                              item.is_included ? 'bg-emerald-600' : 'bg-gray-700'
                            }`}>
                              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-150 ${
                                item.is_included ? 'left-3.5' : 'left-0.5'
                              }`} />
                            </div>
                          </button>
                          <button
                            onClick={() => setEditItem(item)}
                            className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-sky-400 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && item.description && (
                      <tr className="bg-[#1a1a1a]/40">
                        <td colSpan={8} className="px-4 py-3 text-xs text-gray-400">
                          <span className="text-gray-500 font-medium">Description:</span>{" "}
                          <span className="whitespace-pre-wrap">{item.description}</span>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-800 bg-[#1a1a1a] flex-shrink-0">
            <p className="text-xs text-gray-500">
              Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                className="p-1.5 rounded hover:bg-[#222] text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    i === safePage
                      ? "bg-sky-600 text-white"
                      : "text-gray-400 hover:bg-[#222] hover:text-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1}
                className="p-1.5 rounded hover:bg-[#222] text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAddModal && (
        <ItemModal mode="add" initial={EMPTY_ITEM} members={members} onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {editItem && (
        <ItemModal
          mode="edit"
          initial={{
            category: editItem.category,
            name: editItem.name,
            description: editItem.description ?? "",
            cost_usd: editItem.cost_usd,
            cost_type: editItem.cost_type,
            tier: editItem.tier,
            source_label: editItem.source_label ?? "",
            source_url: editItem.source_url ?? "",
            is_optional: editItem.is_optional,
            is_included: editItem.is_included,
            member_ids: editItem.member_ids,
            package_categories: editItem.package_categories,
          }}
          members={members}
          onSave={handleEdit}
          onClose={() => setEditItem(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          itemName={deleteTarget.name}
          onConfirm={() => onDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
