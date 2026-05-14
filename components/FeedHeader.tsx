import React from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "./Icons";
import { UserAvatar } from "./UserAvatar";
import { User } from "../types";

export const CATEGORY_ICONS_MAP: Record<string, any> = {
  الكل: Icons.Layout,
  فلسفة: Icons.BookOpen,
  تعليم: Icons.GraduationCap,
  تكنولوجيا: Icons.Cpu,
  فن: Icons.Palette,
  "تطوير المهارات": Icons.Target,
  أخرى: Icons.MoreHorizontal,
};

interface FeedHeaderProps {
  currentUser: User | null;
  filter: string;
  setFilter: (filter: string) => void;
  handleOpenCreateModal: () => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({ currentUser, filter, setFilter, handleOpenCreateModal }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl shadow-xl border-b border-white/10 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all duration-300">
      <div className="max-w-6xl mx-auto py-2 px-1 sm:px-2">
        <div className="flex gap-2 items-center bg-white/5 p-1 rounded-full border border-white/10 shadow-inner backdrop-blur-sm w-full transition-all duration-300 focus-within:bg-white/10 focus-within:border-white/20 mb-2">
          <div className="shrink-0">
            <UserAvatar 
              user={{ id: currentUser?.id || '', name: currentUser?.name || 'U', photoURL: currentUser?.photoURL }} 
              className="w-10 h-10 hover:scale-105 transition-transform" 
              onClick={() => navigate(`/profile/${currentUser?.id}`)}
            />
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex-1 text-right px-4 md:px-5 py-2 bg-transparent hover:bg-white/5 rounded-full text-gray-300 text-sm font-bold transition-all flex justify-between items-center group"
          >
            <span className="truncate">
              بماذا تفكر يا {currentUser?.name?.split(" ")[0] || "مبدع"}؟
            </span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-accent to-orange-500 flex items-center justify-center shadow-lg group-hover:rotate-90 transition-transform duration-500">
                <Icons.Plus className="w-4 h-4 text-white" />
              </div>
            </div>
          </button>
        </div>
        
        <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
          {Object.keys(CATEGORY_ICONS_MAP).map((cat) => {
            const Icon = CATEGORY_ICONS_MAP[cat];
            const isActive = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`snap-start px-4 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all duration-300 text-xs font-bold border ${ isActive ? "bg-white/10 text-white border-white/20 shadow-sm" : "bg-transparent hover:bg-white/5 text-gray-400 border-transparent hover:text-white"}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-gray-500"}`} />
                <span>{cat}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
