import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { UserAvatar } from "../UserAvatar";
import { Idea } from "../../types";
import { Icons } from "../Icons";
import { useNavigate } from "react-router-dom";
import { AuthService } from '../../src/features/auth/services/auth.service';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  ideas: Idea[];
}

export const Sidebar: React.FC<SidebarProps> = ({ ideas }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  if (!currentUser) return null;

  // Derive level and progress from followersCount (just an example mapping for Gamification)
  const score = currentUser.followersCount || 0;
  const level = Math.floor(score / 10) + 1;
  const nextLevelRequirement = level * 10;
  const progress = (score % 10) / 10 * 100;

  // Extract trending tags
  const tagsMap: Record<string, number> = {};
  ideas.forEach(idea => {
    if (idea.hashtags) {
      idea.hashtags.forEach(tag => {
        tagsMap[tag] = (tagsMap[tag] || 0) + 1;
      });
    }
  });
  
  const trendingTags = Object.entries(tagsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="hidden lg:block w-80 flex-shrink-0 space-y-6 sticky top-24 pt-4 animate-fade-in-up">
      {/* User Profile Mini */}
      <div 
        onClick={() => navigate(`/profile/${currentUser.id}`)}
        className="glass-card rounded-[2rem] p-6 text-center border border-white/5 relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent z-0"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <UserAvatar user={currentUser} className="w-20 h-20 mb-3 border-2 border-white/10 shadow-lg group-hover:scale-105 transition-transform" />
            <div className="absolute bottom-3 -right-2 bg-accent/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Icons.User className="w-3 h-3" />
            </div>
          </div>
          <h3 className="font-bold text-lg text-white group-hover:text-accent transition-colors">{currentUser.name}</h3>
          <span className="text-xs text-gray-400 mb-4">{currentUser.specialty}</span>
          
          {/* Level Progress */}
          <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/5 text-right mt-2">
            <div className="flex justify-between items-end mb-2">
              <span className="text-white font-bold text-sm">المستوى {level}</span>
              <span className="text-accent text-[10px] font-bold">
                {score} / {nextLevelRequirement} نقطة
              </span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-accent to-pink-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">شارك أفكارك لزيادة مستواك!</p>
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="glass-card rounded-[2rem] p-6 border border-white/5 text-right">
        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
          <Icons.TrendingUp className="w-4 h-4 text-accent" /> مواضيع رائجة
        </h4>
        <div className="space-y-3">
          {trendingTags.length > 0 ? (
            trendingTags.map(([tag, count]) => (
              <div key={tag} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
                <span className="text-sm text-gray-300 font-bold group-hover:text-accent transition-colors">
                  #{tag}
                </span>
                <span className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-gray-400 border border-white/5">
                  {count} فكرة
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">لا توجد مواضيع رائجة حالياً</p>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={() => AuthService.logout()}
        className="w-full flex items-center justify-center gap-3 p-4 text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
      >
        <LogOut size={20} />
        <span className="font-tajawal font-bold">تسجيل الخروج</span>
      </button>
    </div>
  );
};
