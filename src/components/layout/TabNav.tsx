"use client";

import { TABS, type TabKey } from "../../lib/constants";
import { TAB_ICONS } from "../../lib/icons";

interface TabNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="bg-[#111111] border-b border-gray-800 sticky top-0 z-10 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex overflow-x-auto scrollbar-hide -mb-px">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`whitespace-nowrap py-3 px-4 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? "border-sky-400 text-sky-300"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
