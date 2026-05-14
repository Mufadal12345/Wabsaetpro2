import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StoriesBar } from '../components/home/StoriesBar';
import { useStories } from '../hooks/useAppQueries';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { ChevronLeft, Sparkles, Clock, Users, Plus } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext';

export const StoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: fetchedStories, isLoading } = useStories();
    const { users, follows } = useData();
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [isCreating, setIsCreating] = useState(false);
    const [storyText, setStoryText] = useState('');
    const [selectedGradient, setSelectedGradient] = useState('bg-gradient-to-tr from-pink-500 to-orange-400');

    const gradients = [
        'bg-gradient-to-tr from-pink-500 to-orange-400',
        'bg-gradient-to-tr from-blue-500 to-cyan-400',
        'bg-gradient-to-tr from-indigo-500 to-purple-500',
        'bg-gradient-to-tr from-emerald-500 to-teal-400',
        'bg-gradient-to-tr from-rose-500 to-red-500'
    ];

    const handlePostStory = async () => {
        if(!storyText.trim() || !currentUser) return;

        const urlMatch = storyText.match(/(https?:\/\/[^\s]+)/);
        let linkUrl = urlMatch ? urlMatch[0] : null;

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

    // Group stories by user like in StoriesBar
    const myFollowings = follows
        .filter(f => f.followerId === currentUser?.id)
        .map(f => f.followingId);

    const grouped = (fetchedStories || []).reduce((acc: any, story) => {
        const created = new Date(story.createdAt);
        const now = new Date();
        const diffHours = Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 24) {
            if (!acc[story.userId]) acc[story.userId] = [];
            acc[story.userId].push(story);
        }
        return acc;
    }, {});

    const formatted = Object.keys(grouped).map(uid => {
        const userStories = grouped[uid].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return {
            userId: uid,
            latestStory: userStories[userStories.length - 1],
            allStories: userStories
        };
    });

    const openStory = (feed: any) => {
        navigate(`/story/${feed.userId}`, { state: { stories: formatted } });
    }

    return (
        <div className="min-h-screen bg-black text-white font-tajawal pb-24 relative overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="text-accent w-5 h-5" />
                    القصص
                </h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <div className="max-w-4xl mx-auto p-4 space-y-8">
                {/* Top Bar Preview */}
                <section>
                    <StoriesBar />
                </section>

                {/* All Stories Grid */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-400">
                            <Clock className="w-4 h-4" />
                            جميع القصص النشطة
                        </h2>
                        <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-md">
                            {formatted.length} مستخدم نشط
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="aspect-[9/16] bg-zinc-900 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : formatted.length > 0 ? (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {formatted.map((feed) => {
                                const author = users.find(u => u.id === feed.userId);
                                const isFollowed = myFollowings.includes(feed.userId);
                                return (
                                    <motion.button
                                        key={feed.userId}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => openStory(feed)}
                                        className="relative aspect-square rounded-full overflow-hidden group border-2 border-accent/20"
                                    >
                                        <div className={`absolute inset-0 ${feed.latestStory.backgroundGradient || 'bg-zinc-900'} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                        
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                                        
                                        <div className="absolute inset-0 p-2 flex flex-col justify-center items-center text-center">
                                            <div className="p-0.5 rounded-full bg-gradient-to-tr from-accent to-purple-500 mb-2">
                                                <div className="bg-black rounded-full p-0.5">
                                                    <UserAvatar user={{ id: author?.id || '', name: author?.name || '', photoURL: author?.photoURL }} className="w-10 h-10" />
                                                </div>
                                            </div>
                                            
                                            <div className="w-full px-1">
                                                <p className="text-[10px] font-bold truncate text-white">{author?.name?.split(' ')[0]}</p>
                                            </div>
                                        </div>

                                        {isFollowed && (
                                            <div className="absolute top-3 right-3">
                                                <Users size={12} className="text-accent" />
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-white/10">
                            <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-500 font-medium">لا توجد قصص نشطة حالياً</p>
                            <p className="text-zinc-600 text-sm mt-1">تواصل مع الآخرين لرؤية قصصهم هنا</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Floating Action Button */}
            {currentUser && (
                <button 
                    onClick={() => setIsCreating(true)}
                    className="fixed bottom-32 right-6 w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl shadow-accent/40 z-50 active:scale-90 transition-transform"
                >
                    <Plus size={32} />
                </button>
            )}

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
                                    <ChevronLeft size={24} className="rotate-180" />
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
};
