"use client";

import { useState } from "react";

interface RateInputProps {
  rate: number;
  onSave: (rate: number) => void;
}

export default function RateInput({ rate, onSave }: RateInputProps) {
  const [editing, setEditing] = useState(false);
  const [localRate, setLocalRate] = useState(rate.toString());

  function handleSave() {
    const parsed = parseFloat(localRate);
    if (!isNaN(parsed) && parsed > 0) {
      onSave(parsed);
    }
    setEditing(false);
  }

  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-200">Exchange Rate</p>
        <p className="text-xs text-gray-500">1 USD = ? TTD</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={localRate}
            onChange={(e) => setLocalRate(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-24 px-3 py-1.5 bg-[#1a1a1a] border border-sky-700 rounded-lg text-right font-mono text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-500"
          >
            Save
          </button>
          <button
            onClick={() => {
              setLocalRate(rate.toString());
              setEditing(false);
            }}
            className="px-3 py-1.5 text-gray-400 text-xs hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-lg font-mono font-bold text-sky-300 hover:text-sky-200 hover:bg-sky-950/50 px-3 py-1 rounded-lg transition-colors"
        >
          {rate.toFixed(2)}
        </button>
      )}
    </div>
  );
}
