import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { Icons } from "../Icons";
import { useNavigate } from "react-router-dom";

export const AdminOverlay: React.FC = () => {
  const { currentUser } = useAuth();
  const { suggestions } = useData();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isSuperAdmin = currentUser?.role === "super_admin";
  if (!isSuperAdmin) return null;

  const pendingSuggestionsCount = suggestions.length; // You can filter based on status if you add it.

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-red-600 to-rose-500 hover:from-rose-500 hover:to-red-400 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 group transition-all"
      >
        <Icons.Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {pendingSuggestionsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-rose-600 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-lg">
            {pendingSuggestionsCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-80 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in-up">
      <div className="bg-gradient-to-r from-red-600/20 to-rose-500/10 p-4 border-b border-white/5 flex justify-between items-center text-right">
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">
          <Icons.X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-white">لوحة الإدارة السريعة</h4>
          <Icons.Shield className="w-4 h-4 text-rose-500" />
        </div>
      </div>
      
      <div className="p-4 space-y-3 text-right">
         <button 
            onClick={() => { setIsOpen(false); navigate("/admin/messages"); }}
            className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            {pendingSuggestionsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingSuggestionsCount} جديد
              </span>
            )}
            <div className="flex items-center gap-2 text-gray-300 group-hover:text-white ml-auto">
              <span className="text-sm font-bold">الاقتراحات والرسائل</span>
              <Icons.Message className="w-4 h-4" />
            </div>
         </button>

         <button 
            onClick={() => { setIsOpen(false); navigate("/admin/members"); }}
            className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-2 text-gray-300 group-hover:text-white ml-auto">
              <span className="text-sm font-bold">إدارة الأعضاء</span>
              <Icons.Users className="w-4 h-4" />
            </div>
         </button>
         
         <button 
            onClick={() => { setIsOpen(false); navigate("/admin"); }}
            className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold py-2 rounded-xl transition-colors border border-white/5"
          >
            الذهاب للوحة التحكم الكاملة
         </button>
      </div>
    </div>
  );
};
