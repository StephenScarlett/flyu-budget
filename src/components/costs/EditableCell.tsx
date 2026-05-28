"use client";

import { useState, useEffect } from "react";

interface EditableCellProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  format: (value: number) => string;
}

export default function EditableCell({ value, onSave, format }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  async function handleSave() {
    const parsed = parseFloat(localValue);
    if (isNaN(parsed) || parsed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(parsed);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="number"
        step="0.01"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setLocalValue(value.toString());
            setEditing(false);
          }
        }}
        className="w-24 px-2 py-1 bg-[#1a1a1a] border border-sky-700 rounded text-right font-mono text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      disabled={saving}
      className="font-mono text-sm text-right hover:bg-[#1a1a1a] px-2 py-1 rounded cursor-pointer transition-colors w-full block text-gray-200"
    >
      {saving ? "..." : format(value)}
    </button>
  );
}
