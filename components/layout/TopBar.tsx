import React, { useState, useEffect } from 'react';
import { Bell, Plus, Lightbulb, PlayCircle, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../Icons';

export const TopBar: React.FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;
        
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = undefined;
            }
            if (user) {
                const q = query(
                    collection(db, 'notifications'),
                    where('recipientId', '==', user.uid),
                    where('isRead', '==', false)
                );
                
                unsubscribeSnapshot = onSnapshot(q, (snap) => {
                    setUnreadCount(snap.docs.length);
                });
            } else {
                setUnreadCount(0);
            }
        });

        return () => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
            unsubscribeAuth();
        };
    }, []);

    const openIdeaModal = () => {
        setIsMenuOpen(false);
        window.dispatchEvent(new Event("openCreateModal"));
    };

    const openVisualModal = () => {
        setIsMenuOpen(false);
        // We can just open the same modal for now
        window.dispatchEvent(new CustomEvent("openCreateModal", { detail: { type: 'visual' } }));
    };

    if (pathname === '/search') {
        return null; // Hide TopBar completely on search
    }

    const matchProfile = pathname.match(/\/profile\/(.+)/);
    if (matchProfile) {
        const isOwnProfile = auth.currentUser?.uid === matchProfile[1];
        
        return (
            <header className="sticky top-0 z-[100] bg-black/80 backdrop-blur-lg border-b border-white/5 p-4 flex justify-between items-center h-16 safe-top transition-all">
                <div className="flex-1">
                  {/* Optional: Add a back button here instead of empty space */}
                  {/* <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                      <ChevronRight className="w-5 h-5 text-white" />
                  </button> */}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate('/notifications')} 
                      className="relative p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Bell className="text-white w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent border-2 border-black rounded-full ring-2 ring-accent/20"></span>
                        )}
                    </button>
                    {isOwnProfile && (
                      <button 
                        onClick={() => window.dispatchEvent(new Event("openSettings"))} 
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Settings className="w-5 h-5 text-white" />
                      </button>
                    )}
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center h-16 safe-top transition-all active:bg-black/90">
            <div className="flex items-center gap-3">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                    <Icons.Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold font-amiri text-white tracking-wide group-hover:text-amber-500 transition-colors">متحف الفكر</h1>
                </div>
                
                <div className="relative ml-2">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-2xl hover:bg-amber-500/20 transition-all group active:scale-95 shadow-[0_0_20px_-10px_rgba(245,158,11,0.3)]"
                    >
                        <Plus className="w-4 h-4 text-amber-500 group-hover:rotate-90 transition-transform" />
                        <span className="text-[11px] font-bold text-amber-500 hidden sm:inline">نشر جديد</span>
                    </button>
                    
                    <AnimatePresence>
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-12 right-0 w-56 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5"
                                >
                                    <div className="p-2 space-y-1">
                                      <button onClick={openIdeaModal} className="w-full text-right px-4 py-3 hover:bg-white/5 rounded-xl flex items-center justify-between text-white transition-colors group">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold">نشر فكرة</span>
                                            <span className="text-[9px] text-zinc-500">شارك إبداعك الفكري</span>
                                          </div>
                                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20">
                                            <Lightbulb className="w-4 h-4 text-amber-500" />
                                          </div>
                                      </button>
                                      <button onClick={openVisualModal} className="w-full text-right px-4 py-3 hover:bg-white/5 rounded-xl flex items-center justify-between text-white transition-colors group">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold">رابط مرئي</span>
                                            <span className="text-[9px] text-zinc-500">يوتيوب، مقالات، مراجع</span>
                                          </div>
                                          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20">
                                            <PlayCircle className="w-4 h-4 text-pink-500" />
                                          </div>
                                      </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/suggestions')}
                  className="hidden sm:flex items-center gap-2 bg-[#111111] hover:bg-[#1A1A1A] border border-white/5 px-4 py-2 rounded-2xl transition-all"
                >
                    <span className="text-[11px] text-zinc-400 font-bold">مجلس النقاش</span>
                    <Icons.MessageSquare className="w-4 h-4 text-zinc-500" />
                </button>
                
                <div className="flex flex-row items-center gap-1">
                    <button 
                      onClick={() => navigate('/notifications')} 
                      className="relative p-2.5 rounded-xl bg-[#111111] hover:bg-[#1A1A1A] border border-white/5 transition-all active:scale-90"
                    >
                        <Bell className="text-zinc-400 w-5 h-5 group-hover:text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent border-2 border-black rounded-full ring-2 ring-accent/20"></span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );

};
