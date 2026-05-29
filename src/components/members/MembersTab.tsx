"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { Member } from "../../lib/supabase/types";
import { createClient } from "../../lib/supabase/client";
import { Plus, Pencil, Trash2, Check, Mail, Phone, StickyNote, UserPlus } from "../../lib/icons";
import { LayoutGrid, List, Camera } from "lucide-react";

interface MembersTabProps {
  members: Member[];
  tripId: string;
  onAdd: (member: Omit<Member, "id" | "created_at">) => Promise<string | null>;
  onUpdate: (id: string, updates: Partial<Member>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewProfile?: (memberId: string) => void;
}

type ViewMode = "grid" | "list";

export default function MembersTab({ members, tripId, onAdd, onUpdate, onDelete, onViewProfile }: MembersTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const deleteBackdropRef = useRef<HTMLDivElement>(null);

  const activeMembers = members.filter((m) => m.is_active);
  const inactiveMembers = members.filter((m) => !m.is_active);

  function openAdd() {
    setEditingMember(null);
    setModalOpen(true);
  }

  function openEdit(member: Member) {
    setEditingMember(member);
    setModalOpen(true);
  }

  async function toggleActive(member: Member) {
    await onUpdate(member.id, { is_active: !member.is_active });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-sky-400" />
            Trip Members
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeMembers.length} active{inactiveMembers.length > 0 && ` · ${inactiveMembers.length} inactive`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[#1a1a1a] rounded-lg border border-gray-800 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-sky-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-sky-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={openAdd}
            className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-500 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Active Members */}
      {activeMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
            Active ({activeMembers.length})
          </h3>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeMembers.map((m, i) => (
                <GridCard key={m.id} member={m} index={i} onEdit={() => openEdit(m)} onToggle={() => toggleActive(m)} onDelete={() => setDeleteTarget(m)} onViewProfile={onViewProfile ? () => onViewProfile(m.id) : undefined} />
              ))}
            </div>
          ) : (
            <div className="bg-[#141414] rounded-xl border border-gray-800 divide-y divide-gray-800">
              {activeMembers.map((m, i) => (
                <ListRow key={m.id} member={m} index={i} onEdit={() => openEdit(m)} onToggle={() => toggleActive(m)} onDelete={() => setDeleteTarget(m)} onViewProfile={onViewProfile ? () => onViewProfile(m.id) : undefined} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
            Inactive ({inactiveMembers.length})
          </h3>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {inactiveMembers.map((m, i) => (
                <GridCard key={m.id} member={m} index={i} onEdit={() => openEdit(m)} onToggle={() => toggleActive(m)} onDelete={() => setDeleteTarget(m)} onViewProfile={onViewProfile ? () => onViewProfile(m.id) : undefined} />
              ))}
            </div>
          ) : (
            <div className="bg-[#141414] rounded-xl border border-gray-800 divide-y divide-gray-800 opacity-60">
              {inactiveMembers.map((m, i) => (
                <ListRow key={m.id} member={m} index={i} onEdit={() => openEdit(m)} onToggle={() => toggleActive(m)} onDelete={() => setDeleteTarget(m)} onViewProfile={onViewProfile ? () => onViewProfile(m.id) : undefined} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && (
        <div className="text-center py-16 animate-fade-up">
          <UserPlus className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No members added yet.</p>
          <p className="text-gray-600 text-xs mt-1">Click &ldquo;Add&rdquo; to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <MemberModal
          member={editingMember}
          tripId={tripId}
          onSave={async (data) => {
            if (editingMember) {
              await onUpdate(editingMember.id, data);
              return editingMember.id;
            } else {
              const newId = await onAdd({
                trip_id: tripId,
                auth_user_id: null,
                is_active: true,
                ...data,
              } as Omit<Member, "id" | "created_at">);
              return newId;
            }
          }}
          onDone={() => { setModalOpen(false); setEditingMember(null); }}
          onClose={() => { setModalOpen(false); setEditingMember(null); }}
          onUpdate={onUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          ref={deleteBackdropRef}
          onClick={(e) => e.target === deleteBackdropRef.current && setDeleteTarget(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop"
        >
          <div className="bg-[#181818] border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-950/60 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Delete Member</h3>
              </div>
              <p className="text-sm text-gray-400">
                Are you sure you want to permanently delete <span className="text-white font-medium">&ldquo;{deleteTarget.name}&rdquo;</span>?
                Consider setting them as inactive instead.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-800">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
                Cancel
              </button>
              <button
                onClick={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Avatar ─── */
function MemberAvatar({ member, size = "sm" }: { member: Member; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-20 h-20 text-2xl" : size === "md" ? "w-11 h-11 text-base" : "w-9 h-9 text-sm";
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0 ${
      member.is_active ? "bg-sky-950/60 text-sky-300" : "bg-gray-800 text-gray-500"
    }`}>
      {member.avatar_url ? (
        <Image src={member.avatar_url} alt={member.name} width={80} height={80} className="w-full h-full object-cover" />
      ) : (
        member.name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

/* ─── Grid Card ─── */
function GridCard({ member, index, onEdit, onToggle, onDelete, onViewProfile }: {
  member: Member; index: number; onEdit: () => void; onToggle: () => void; onDelete: () => void; onViewProfile?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-150 animate-fade-up cursor-pointer ${
        member.is_active
          ? "bg-[#141414] border-gray-800 hover:border-sky-700/50 hover:bg-[#161922]"
          : "bg-[#0e0e0e] border-gray-800/50 opacity-50"
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onViewProfile ?? onEdit}
    >
      <div className="flex flex-col items-center text-center">
        <MemberAvatar member={member} size="md" />
        <p className={`font-medium text-sm mt-2 ${member.is_active ? "text-white" : "text-gray-400 line-through"}`}>
          {member.name}
        </p>
        <p className="text-xs text-gray-500">{member.is_single ? "Single" : "Shared"}</p>
        {member.email && (
          <p className="text-xs text-gray-600 truncate max-w-full mt-1">{member.email}</p>
        )}
      </div>
      <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-gray-800/50">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="group/toggle flex items-center gap-1 cursor-pointer"
          title={member.is_active ? "Set inactive" : "Set active"}
        >
          <div className={`relative w-7 h-4 rounded-full transition-colors duration-150 ${
            member.is_active ? 'bg-emerald-600' : 'bg-gray-700'
          }`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-150 ${
              member.is_active ? 'left-3.5' : 'left-0.5'
            }`} />
          </div>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-sky-400 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── List Row ─── */
function ListRow({ member, index, onEdit, onToggle, onDelete, onViewProfile }: {
  member: Member; index: number; onEdit: () => void; onToggle: () => void; onDelete: () => void; onViewProfile?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a]/60 transition-colors animate-fade-up cursor-pointer"
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onViewProfile ?? onEdit}
    >
      <MemberAvatar member={member} size="sm" />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${member.is_active ? "text-white" : "text-gray-400 line-through"}`}>
          {member.name}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{member.is_single ? "Single Room" : "Shared Room"}</span>
          {member.email && <span className="truncate">{member.email}</span>}
          {member.phone && <span>{member.phone}</span>}
        </div>
      </div>
      {member.notes && (
        <p className="hidden sm:block text-xs text-gray-600 max-w-[200px] truncate">{member.notes}</p>
      )}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="group/toggle flex items-center gap-1 cursor-pointer"
          title={member.is_active ? "Set inactive" : "Set active"}
        >
          <div className={`relative w-7 h-4 rounded-full transition-colors duration-150 ${
            member.is_active ? 'bg-emerald-600' : 'bg-gray-700'
          }`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-150 ${
              member.is_active ? 'left-3.5' : 'left-0.5'
            }`} />
          </div>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-sky-400 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Member Modal (Add/Edit + Avatar Upload) ─── */
function MemberModal({ member, tripId, onSave, onDone, onClose, onUpdate }: {
  member: Member | null;
  tripId: string;
  onSave: (data: Partial<Member>) => Promise<string | null>;
  onDone: () => void;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Member>) => Promise<void>;
}) {
  const isEdit = !!member;
  const [form, setForm] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    is_single: member?.is_single ?? false,
    notes: member?.notes ?? "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(member?.avatar_url ?? null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  async function uploadAvatar(file: File, memberId: string): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `avatars/${memberId}.${ext}`;
    const { error } = await supabase.storage.from("members").upload(path, file, { upsert: true });
    if (error) {
      console.error("Avatar upload error:", error);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from("members").getPublicUrl(path);
    return publicUrl;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    if (member) {
      // Upload immediately for existing member
      setUploading(true);
      const url = await uploadAvatar(file, member.id);
      if (url) {
        setAvatarUrl(url);
        await onUpdate(member.id, { avatar_url: url });
      }
      setUploading(false);
    } else {
      // Store file for upload after member is created
      setPendingFile(file);
    }
    e.target.value = "";
  }

  async function handleSave() {
    if (!form.name.trim()) return;

    const memberData: Partial<Member> = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      avatar_url: avatarUrl,
      is_single: form.is_single,
      notes: form.notes.trim() || null,
    };

    const savedId = await onSave(memberData);

    // Upload pending avatar for new members
    if (pendingFile && savedId) {
      const url = await uploadAvatar(pendingFile, savedId);
      if (url) await onUpdate(savedId, { avatar_url: url });
    }

    onDone();
  }

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-backdrop"
    >
      <div className="bg-[#181818] border border-gray-700 rounded-xl w-full max-w-md shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {isEdit ? <Pencil className="w-5 h-5 text-sky-400" /> : <UserPlus className="w-5 h-5 text-sky-400" />}
            {isEdit ? "Edit Member" : "Add Member"}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <button
              onClick={() => fileRef.current?.click()}
              className="relative group cursor-pointer"
              title="Click to upload photo"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden ${
                avatarPreview ? "" : "bg-sky-950/60 text-sky-300"
              }`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  form.name ? form.name.charAt(0).toUpperCase() : <Camera className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1.5">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-sky-600 focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-sky-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-sky-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1.5">Room Type</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={!form.is_single}
                    onChange={() => setForm({ ...form, is_single: false })}
                    className="w-4 h-4 border-gray-600 bg-[#222] text-sky-500 focus:ring-sky-500"
                  />
                  Shared Room
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.is_single}
                    onChange={() => setForm({ ...form, is_single: true })}
                    className="w-4 h-4 border-gray-600 bg-[#222] text-sky-500 focus:ring-sky-500"
                  />
                  Single Room
                </label>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1.5">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes..."
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-sky-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isEdit ? "Save Changes" : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
