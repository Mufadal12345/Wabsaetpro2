import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { useFeedActions } from '../../hooks/useFeedActions';
import { Modal } from '../../pages/admin/Modal';
import { Icons } from '../Icons';
import { UserAvatar } from '../UserAvatar';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const {
        isModalOpen,
        setIsModalOpen,
        editingIdea,
        setEditingIdea,
        title,
        setTitle,
        category,
        setCategory,
        content,
        setContent,
        handleOpenCreateModal,
        handleSubmit,
        currentUser,
    } = useFeedActions();

    useEffect(() => {
        const handleOpen = () => handleOpenCreateModal();
        window.addEventListener("openCreateModal", handleOpen);
        return () => {
            window.removeEventListener("openCreateModal", handleOpen);
        };
    }, [handleOpenCreateModal]);

    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col font-tajawal selection:bg-accent/30 overflow-x-hidden">
            <TopBar />
            <main className="flex-1 min-h-0">
                {children}
            </main>
            <BottomNav />

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingIdea(null);
                }}
                title={editingIdea ? "تعديل محتواك" : "✨ إلهام جديد"}
            >
                <div className="space-y-6 font-tajawal pb-2 overflow-hidden">
                    <div className="relative">
                      {/* Decorative elements */}
                      <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent/10 blur-3xl rounded-full" />
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
                      
                      <div className="bg-[#0A0A0A] p-4 sm:p-6 rounded-3xl border border-white/5 relative z-10 shadow-inner group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                              <div className="rotate-3 group-hover:rotate-0 transition-transform duration-500 rounded-full">
                                  {currentUser ? (
                                      <UserAvatar user={{ id: currentUser.id, name: currentUser.name || 'U', photoURL: currentUser.photoURL }} className="w-12 h-12" />
                                  ) : (
                                      <div className="w-12 h-12 rounded-full border border-white/5 bg-zinc-900 flex flex-col justify-center items-center">
                                          <Icons.User className="w-6 h-6 text-white" />
                                      </div>
                                  )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-black rounded-full shadow-lg z-10" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-lg">
                                    {currentUser?.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-accent/10 text-accent font-bold px-2.5 py-0.5 rounded-lg border border-accent/20 flex items-center gap-1.5 uppercase tracking-wider">
                                        <div className="w-1 h-1 bg-accent rounded-full animate-pulse" /> متاح عام
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group/input">
                              <input
                                  value={title}
                                  onChange={(e) => setTitle(e.target.value)}
                                  type="text"
                                  placeholder="عنوان الفكرة... (اختياري)"
                                  className="w-full bg-transparent text-xl font-black text-white placeholder-zinc-700 border-none focus:ring-0 px-2 transition-all outline-none"
                              />
                              <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-white/5 group-focus-within/input:bg-accent/30 transition-colors" />
                            </div>
                            
                            <div className="relative">
                              <textarea
                                  value={content}
                                  onChange={(e) => setContent(e.target.value)}
                                  placeholder="اكتب ما يجول في خاطرك من إبداع فكري..."
                                  className="w-full bg-transparent text-lg text-zinc-300 placeholder-zinc-700 border-none focus:ring-0 px-2 h-44 resize-none transition-all outline-none overflow-y-auto custom-scrollbar leading-relaxed"
                              ></textarea>
                            </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-2">
                        <div className="w-full sm:w-1/2 flex items-center bg-[#0A0A0A] border border-white/5 rounded-2xl px-5 py-3 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group">
                            <Icons.Layout className="w-5 h-5 text-zinc-500 group-hover:text-accent transition-colors" />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-transparent border-none text-zinc-400 font-bold focus:ring-0 outline-none appearance-none pr-3 text-sm"
                            >
                                {["فلسفة", "تعليم", "تكنولوجيا", "فن", "تطوير المهارات", "أخرى"].map((cat) => (
                                    <option
                                        key={cat}
                                        value={cat}
                                        className="bg-[#0F0F0F] text-white"
                                    >
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            <Icons.ChevronDown className="w-4 h-4 text-zinc-600" />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim()}
                            className={`w-full sm:w-auto px-10 py-4 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all ${
                              content.trim() 
                                ? "bg-gradient-to-r from-accent to-orange-500 text-white shadow-[0_10px_30px_-10px_rgba(255,70,0,0.4)] hover:scale-105 active:scale-95 active:shadow-none" 
                                : "bg-white/5 text-zinc-700 cursor-not-allowed border border-white/5"
                            }`}
                        >
                            <span className="tracking-tight">نشر الآن</span>
                            <Icons.Send className={`w-5 h-5 ${content.trim() ? "translate-x-[-2px] translate-y-[1px]" : ""}`} />
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

