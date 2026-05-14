import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Plus } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const StoriesBar = React.memo(() => {
    const navigate = useNavigate();
    const [stories, setStories] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const [storyText, setStoryText] = useState('');
    const [selectedGradient, setSelectedGradient] = useState('bg-gradient-to-tr from-pink-500 to-orange-400');
    
    const { currentUser } = useAuth();
    const { users, follows } = useData();
    const { showToast } = useToast();

    const gradients = [
        'bg-gradient-to-tr from-pink-500 to-orange-400',
        'bg-gradient-to-tr from-blue-500 to-cyan-400',
        'bg-gradient-to-tr from-indigo-500 to-purple-500',
        'bg-gradient-to-tr from-emerald-500 to-teal-400',
        'bg-gradient-to-tr from-rose-500 to-red-500'
    ];

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'stories'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const allStories = snap.docs.map(d => ({id: d.id, ...(d.data() as any)}));
            const myFollowings = follows
                .filter(f => f.followerId === currentUser?.id)
                .map(f => f.followingId);

            const validStories = allStories.filter((s: any) => {
                const created = new Date(s.createdAt);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - created.getTime());
                const diffHours = diffTime / (1000 * 60 * 60); 
                
                const isFollowedOrOwn = s.userId === currentUser?.id || myFollowings.includes(s.userId);
                return diffHours < 24 && isFollowedOrOwn;
            });
            const grouped = validStories.reduce((acc, story) => {
                if(!acc[story.userId]) acc[story.userId] = [];
                acc[story.userId].push(story);
                return acc;
            }, {} as Record<string, any[]>);
            const formatted = Object.keys(grouped).map(uid => {
                // sort oldest first so they play logically
                const userStories = grouped[uid].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                const latest = userStories[userStories.length - 1];
                return {
                    userId: uid,
                    userName: latest.userName,
                    userImg: latest.userImg,
                    latestStory: latest, // for thumbnail
                    allStories: userStories
                };
            });
            setStories(formatted);
        });
        return () => unsubscribe();
    }, [currentUser, follows]);

    const handlePostStory = async () => {
        if(!storyText.trim() || !currentUser) return;

        // Extract first URL if any
        const urlMatch = storyText.match(/(https?:\/\/[^\s]+)/);
        let linkUrl = urlMatch ? urlMatch[0] : null;
        
        // Clean trailing punctuation
        if (linkUrl) {
            linkUrl = linkUrl.replace(/[.,!?;:]+$/, '');
        }

        try {
            await addDoc(collection(db, 'stories'), {
                userId: currentUser.id,
                userName: currentUser.name,
                userImg: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`,
                text: storyText,
                linkUrl: linkUrl,
                backgroundGradient: selectedGradient,
                viewers: [],
                likes: [],
                createdAt: new Date().toISOString(),
            });
            setIsCreating(false);
            setStoryText('');
            showToast('تم نشر قصتك بنجاح', 'success');
        } catch(e) {
            showToast('حدث خطأ أثناء النشر', 'error');
        }
    }

    const openStory = (feed: any) => {
        navigate(`/story/${feed.userId}`, { state: { stories } });
    }

    return (
        <div className="w-full overflow-hidden bg-gradient-to-b from-black to-zinc-950 border-b border-white/5 py-6">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide snap-x items-center">
                    
                    {/* Create Story Button */}
                    <div className="flex flex-col items-center gap-3 shrink-0 snap-start">
                        <button 
                            onClick={() => {
                                const mySelectedFeed = stories.find(s => s.userId === currentUser?.id);
                                if (mySelectedFeed) {
                                    openStory(mySelectedFeed);
                                } else {
                                    setIsCreating(true);
                                }
                            }}
                            className="relative group block"
                        >
                            <div className={`w-16 h-16 rounded-full overflow-hidden p-0.5 transition-all duration-500 bg-gradient-to-tr from-accent via-purple-500 to-pink-500 group-hover:rotate-6 active:scale-95 shadow-xl shadow-accent/20`}>
                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                                    {currentUser ? (
                                        <img 
                                            src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} 
                                            alt="" 
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-800" />
                                    )}
                                </div>
                                {!stories.find(s => s.userId === currentUser?.id) && (
                                    <div className="absolute bottom-0 right-0 bg-accent text-white rounded-full border-2 border-black w-6 h-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Plus size={14} className="rotate-0" />
                                    </div>
                                )}
                            </div>
                            <span className="mt-2 text-[10px] text-zinc-400 font-bold tracking-wide uppercase transition-colors group-hover:text-accent">
                                {stories.find(s => s.userId === currentUser?.id) ? 'قصتك' : 'إضافة'}
                            </span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="w-[1px] h-10 bg-white/10 shrink-0" />

                    {/* Users Stories */}
                    {stories.filter(s => s.userId !== currentUser?.id).map(userFeed => {
                        const author = users.find(u => u.id === userFeed.userId);
                        return (
                            <button 
                                key={userFeed.userId} 
                                onClick={() => openStory(userFeed)} 
                                className="flex flex-col items-center gap-3 shrink-0 snap-start group"
                            >
                                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-accent to-indigo-500 shadow-xl shadow-indigo-500/10 transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3 group-active:scale-95">
                                    <div className="bg-black rounded-full p-0.5">
                                        <div className="w-16 h-16 rounded-full overflow-hidden">
                                            <img 
                                                src={author?.photoURL || `https://ui-avatars.com/api/?name=${author?.name}&background=random`} 
                                                alt={author?.name}
                                                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-300 font-medium tracking-wide w-16 truncate text-center transition-colors group-hover:text-white">
                                    {author?.name?.split(' ')[0]}
                                </span>
                            </button>
                        )
                    })}

                    {/* See All Button */}
                    <button 
                        onClick={() => navigate('/stories')}
                        className="flex flex-col items-center gap-3 shrink-0 snap-start group pb-1"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300 group-hover:scale-105">
                            <ChevronLeft size={24} className="text-zinc-500 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold group-hover:text-white transition-colors">عرض الكل</span>
                    </button>

                </div>
            </div>

            {/* Create Story Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 z-[2000] flex flex-col font-tajawal bg-black h-[100dvh]"
                    >
                        <div className={`flex-1 flex flex-col ${selectedGradient} transition-colors duration-500`}>
                            <header className="p-4 flex justify-between items-center z-10">
                                <button onClick={() => setIsCreating(false)} className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full transition-all backdrop-blur-md text-white">
                                     <X size={24} />
                                 </button>
                                 <h2 className="text-white font-bold text-lg drop-shadow-md">إضافة قصة جديدة</h2>
                                 <div className="w-10" />
                            </header>

                            <div className="flex-1 flex items-center justify-center p-8 relative">
                                <textarea 
                                    autoFocus
                                    value={storyText}
                                    onChange={e => setStoryText(e.target.value)}
                                    placeholder="اكتب شيئاً ملهماً..."
                                    maxLength={200}
                                    className="w-full bg-transparent text-center text-4xl font-black text-white placeholder-white/30 border-none focus:ring-0 resize-none outline-none leading-relaxed drop-shadow-2xl"
                                    rows={4}
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle,white_0%,transparent_70%)]" />
                            </div>

                            <div className="bg-black/40 backdrop-blur-2xl border-t border-white/10 p-6 pb-24 space-y-6 overflow-y-auto max-h-[50dvh]">
                                <div className="flex gap-4 justify-center overflow-x-auto py-2 scrollbar-hide">
                                    {gradients.map((g, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setSelectedGradient(g)}
                                            className={`w-10 h-10 rounded-full shrink-0 ${g} border-2 transition-all ${selectedGradient === g ? 'border-white scale-110 rotate-3 shadow-lg' : 'border-transparent hover:scale-105 opacity-60'}`}
                                        />
                                    ))}
                                </div>

                                <button 
                                    onClick={handlePostStory} 
                                    disabled={!storyText.trim()} 
                                    className="w-full py-4 bg-white text-black rounded-full font-black text-xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-2xl mb-8"
                                >
                                    نشر القصة
                                </button>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
});
