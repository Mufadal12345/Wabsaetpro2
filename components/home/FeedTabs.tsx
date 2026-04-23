import React from "react";
import { Icons } from "../Icons";

export type FeedTab = "for_you" | "trending" | "latest";

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "for_you" as FeedTab, label: "مخصص لك", icon: Icons.Star },
    { id: "trending" as FeedTab, label: "رائج", icon: Icons.TrendingUp },
    { id: "latest" as FeedTab, label: "الأحدث", icon: Icons.Clock },
  ];

  return (
    <div className="flex bg-white/5 p-1 rounded-full mb-6 border border-white/5 relative items-center overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-[100px] flex justify-center items-center gap-2 py-3 rounded-full text-sm font-bold transition-all z-10 ${
              isActive ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            {isActive && (
              <div className="absolute inset-0 bg-white/10 rounded-full w-1/3 -z-10 transition-transform duration-300 pointer-events-none" 
                   style={{ transform: `translateX(${tabs.findIndex(t => t.id === tab.id) * 100}%)`}}>
              </div>
            )}
            <Icon className={`w-4 h-4 ${isActive ? "text-accent" : ""}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
