import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Eye, Trash2, MessageCircle, Send, ExternalLink, RefreshCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStories } from '../hooks/useAppQueries';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../contexts/ToastContext';
import { UserAvatar } from '../components/UserAvatar';
import { isImageUrl } from '../utils';

interface StoryComment {
    id: string;
    storyId: string;
    userId: string;
    userName: string;
    userImg: string;
    text: string;
    createdAt: string;
}

interface StoryFeed {
    userId: string;
    userName: string;
    userImg: string;
    allStories: any[];
}

export const StoryPage: React.FC = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    
    // We try to get stories from router state, otherwise fallback to hook
    const passedStories: StoryFeed[] = location.state?.stories;
    const { data: fetchedStories } = useStories();
    
    const [stories, setStories] = useState<StoryFeed[]>(passedStories || []);
    const [viewingStoryData, setViewingStoryData] = useState<{feed: StoryFeed, index: number} | null>(null);
    const [progress, setProgress] = useState(0);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [storyComments, setStoryComments] = useState<StoryComment[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [showBrowser, setShowBrowser] = useState(false);
    const [browserUrl, setBrowserUrl] = useState<string | null>(null);
    const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // Process stories if fetched
    useEffect(() => {
        if (!passedStories && fetchedStories) {
            const grouped = fetchedStories.reduce((acc: any, story) => {
                if (!acc[story.userId]) {
                    acc[story.userId] = {
                        userId: story.userId,
                        userName: story.userName || "مستخدم",
                        userImg: story.userImg || "",
                        allStories: []
                    };
                }
                // Ensure we have the most recent user info from the stories
                if (story.userName && story.userName !== "مستخدم") acc[story.userId].userName = story.userName;
                if (story.userImg) acc[story.userId].userImg = story.userImg;

                acc[story.userId].allStories.push(story);
                return acc;
            }, {});
            
            // Sort stories within each user feed
            const result = Object.values(grouped).map((feed: any) => ({
                ...feed,
                allStories: feed.allStories.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            }));

            setStories(result);
        }
    }, [fetchedStories, passedStories]);

    // Initialize viewer
    useEffect(() => {
        if (stories.length > 0 && !viewingStoryData && userId) {
            const userFeed = stories.find(s => s.userId === userId);
            if (userFeed) {
                setViewingStoryData({ feed: userFeed, index: 0 });
            } else {
                navigate(-1);
            }
        }
    }, [stories, userId, viewingStoryData, navigate]);

    // Update URL if user changes
    useEffect(() => {
        if (viewingStoryData && viewingStoryData.feed.userId !== userId) {
            navigate(`/story/${viewingStoryData.feed.userId}`, { replace: true, state: { stories } });
        }
    }, [viewingStoryData, userId, navigate, stories]);

    // Fetch comments for active story
    useEffect(() => {
        if (viewingStoryData) {
            const activeStory = viewingStoryData.feed.allStories[viewingStoryData.index];
            if (activeStory) {
                const q = query(
                    collection(db, "story_comments"),
                    where("storyId", "==", activeStory.id),
                    orderBy("createdAt", "desc")
                );
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const comments = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as StoryComment));
                    setStoryComments(comments);
                });
                return () => unsubscribe();
            }
        }
    }, [viewingStoryData]);

    // Image detection
    const storyLinkInfo = React.useMemo(() => {
        const activeStory = viewingStoryData?.feed.allStories[viewingStoryData?.index || 0];
        const url = activeStory?.linkUrl;
        if (!url) return { isImage: false, url: null };
        return { isImage: isImageUrl(url), url };
    }, [viewingStoryData]);

    const isImage = storyLinkInfo.isImage;

    // Progress Bar Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (viewingStoryData && !showAnalytics && !showComments && !isPaused && !isTransitioning) {
            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) return 100;
                    return prev + 1; // 5 seconds
                });
            }, 50);
        }
        return () => clearInterval(timer);
    }, [viewingStoryData, showAnalytics, showComments, isPaused, isTransitioning]);

    useEffect(() => {
        if (progress >= 100 && viewingStoryData) {
            handleNextStory();
        }
    }, [progress, viewingStoryData]);

    // Track views unconditionally when activeStory changes
    const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
    const activeStoryId = viewingStoryData?.feed.allStories[viewingStoryData?.index || 0]?.id;
    
    useEffect(() => {
        if (activeStoryId && currentUser && viewingStoryData) {
            const activeStory = viewingStoryData.feed.allStories[viewingStoryData.index];
            if (activeStory && activeStory.userId !== currentUser.id && !viewedStories.has(activeStoryId)) {
                setViewedStories(prev => {
                    const next = new Set(prev);
                    next.add(activeStoryId);
                    return next;
                });
                handleStoryView(activeStoryId);
            }
        }
    }, [activeStoryId, currentUser?.id, viewedStories]);

    // Reset states when story changes
    useEffect(() => {
        setIsTransitioning(false);
        setProgress(0);
    }, [activeStoryId]);

    const handleNextStory = () => {
        if (!viewingStoryData || isTransitioning) return;
        setIsTransitioning(true);
        
        // Small delay to allow transition to register
        setTimeout(() => {
            if (viewingStoryData.index < viewingStoryData.feed.allStories.length - 1) {
                setViewingStoryData({
                    feed: viewingStoryData.feed,
                    index: viewingStoryData.index + 1
                });
                setProgress(0);
                setShowAnalytics(false);
            } else {
                // Find next user
                const currentUserIndex = stories.findIndex(s => s.userId === viewingStoryData.feed.userId);
                if (currentUserIndex >= 0 && currentUserIndex < stories.length - 1) {
                    setViewingStoryData({
                        feed: stories[currentUserIndex + 1],
                        index: 0
                    });
                    setProgress(0);
                    setShowAnalytics(false);
                } else {
                    navigate(-1);
                }
            }
        }, 100);
    };

    const handlePrevStory = () => {
        if (!viewingStoryData || isTransitioning) return;
        setIsTransitioning(true);
        
        setTimeout(() => {
            if (viewingStoryData.index > 0) {
                setViewingStoryData({
                    feed: viewingStoryData.feed,
                    index: viewingStoryData.index - 1
                });
                setProgress(0);
                setShowAnalytics(false);
                setShowComments(false);
            } else {
                // Find prev user
                const currentUserIndex = stories.findIndex(s => s.userId === viewingStoryData.feed.userId);
                if (currentUserIndex > 0) {
                    const prevFeed = stories[currentUserIndex - 1];
                    setViewingStoryData({
                        feed: prevFeed,
                        index: prevFeed.allStories.length - 1
                    });
                    setProgress(0);
                    setShowAnalytics(false);
                    setShowComments(false);
                }
            }
        }, 100);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !commentText.trim() || isSendingComment || !viewingStoryData) return;
        
        const activeStory = viewingStoryData.feed.allStories[viewingStoryData.index];
        setIsSendingComment(true);
        
        try {
            await addDoc(collection(db, "story_comments"), {
                storyId: activeStory.id,
                userId: currentUser.id,
                userName: currentUser.name,
                userImg: currentUser.photoURL || "",
                text: commentText.trim(),
                createdAt: new Date().toISOString()
            });
            setCommentText("");
            showToast("تم إضافة التعليق", "success");
        } catch (err) {
            showToast("حدث خطأ أثناء إضافة التعليق", "error");
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleStoryView = async (storyId: string) => {
        if (!currentUser || !storyId) return;
        try {
            const storyRef = doc(db, "stories", storyId);
            await updateDoc(storyRef, {
                viewers: arrayUnion(currentUser.id)
            });
            
            // Optimistic local update
            if (viewingStoryData) {
                const updatedFeed = { ...viewingStoryData.feed };
                const currentStory = { ...updatedFeed.allStories[viewingStoryData.index] };
                if (!currentStory.viewers) currentStory.viewers = [];
                if (!currentStory.viewers.includes(currentUser.id)) {
                    currentStory.viewers.push(currentUser.id);
                }
                updatedFeed.allStories[viewingStoryData.index] = currentStory;
                setViewingStoryData({ ...viewingStoryData, feed: updatedFeed });
            }
            
            queryClient.invalidateQueries({ queryKey: ["stories"] });
        } catch (err) {
            console.error("View count update failed:", err);
        }
    };

    const handleStoryLike = async (storyId: string) => {
        if (!currentUser || !storyId) return;
        try {
            const storyRef = doc(db, "stories", storyId);
            const isLiked = viewingStoryData?.feed.allStories[viewingStoryData.index].likes?.includes(currentUser.id);
            if (isLiked) {
                await updateDoc(storyRef, { likes: arrayRemove(currentUser.id) });
            } else {
                await updateDoc(storyRef, { likes: arrayUnion(currentUser.id) });
            }
            queryClient.invalidateQueries({ queryKey: ["stories"] });
            
            // Optimistically update local state so UI updates
            if (viewingStoryData) {
                const updatedFeed = { ...viewingStoryData.feed };
                const currentStory = { ...updatedFeed.allStories[viewingStoryData.index] };
                if (!currentStory.likes) currentStory.likes = [];
                if (isLiked) {
                    currentStory.likes = currentStory.likes.filter((id: string) => id !== currentUser.id);
                } else {
                    currentStory.likes.push(currentUser.id);
                }
                updatedFeed.allStories[viewingStoryData.index] = currentStory;
                setViewingStoryData({ ...viewingStoryData, feed: updatedFeed });
            }
            
        } catch (err) {}
    };

    const handleDeleteStory = async (storyId: string) => {
        if (!currentUser || !storyId) return;
        try {
            await deleteDoc(doc(db, "stories", storyId));
            showToast("تم حذف الاستوري بنجاح", "success");
            queryClient.invalidateQueries({ queryKey: ["stories"] });
            navigate(-1);
        } catch (err) {
            showToast("حدث خطأ أثناء الحذف", "error");
        }
    };

    if (!viewingStoryData) return null;

    const activeStory = viewingStoryData.feed.allStories[viewingStoryData.index];
    const isOwner = currentUser?.id === viewingStoryData.feed.userId;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[2000] flex flex-col font-tajawal bg-black h-[100dvh]"
        >
            <div className={`flex-1 flex flex-col ${!isImage ? (activeStory.backgroundGradient || 'from-zinc-900 to-black') : 'bg-black'} bg-gradient-to-br relative overflow-hidden`}>
                
                {/* Background Image Player */}
                <AnimatePresence mode="wait">
                    {isImage && (
                        <motion.div 
                            key={`bg-img-${activeStory.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none"
                        >
                            <motion.img 
                                src={activeStory.linkUrl} 
                                alt="" 
                                initial={{ scale: 1.1, filter: 'blur(60px)' }}
                                animate={{ scale: 1.3, filter: 'blur(100px)' }}
                                transition={{ duration: 20, ease: "linear" }}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 p-2 flex gap-1 z-50">
                    {viewingStoryData.feed.allStories.map((story: any, idx: number) => (
                        <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-white transition-all duration-100 ease-linear"
                                style={{ 
                                    width: idx < viewingStoryData.index ? '100%' : idx === viewingStoryData.index ? `${progress}%` : '0%' 
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-4 left-0 right-0 p-4 flex justify-between items-center z-50">
                    <div className="flex items-center gap-3">
                        <UserAvatar 
                            user={{ 
                                id: viewingStoryData.feed.userId, 
                                name: viewingStoryData.feed.userName, 
                                photoURL: viewingStoryData.feed.userImg 
                            }} 
                            className="w-11 h-11 border-2 border-white/40 shadow-xl"
                        />
                        <div className="flex flex-col">
                            <p className="text-white font-black text-shadow-lg tracking-tight leading-tight">{viewingStoryData.feed.userName}</p>
                            <p className="text-white/60 text-[10px] text-shadow-sm font-bold uppercase tracking-wider">
                                {new Date(activeStory.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2.5 text-white/90 bg-black/30 hover:bg-black/50 rounded-full transition-all backdrop-blur-xl border border-white/10 active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div 
                    className="flex-1 flex flex-col items-center justify-center relative select-none pb-20 pt-20 overflow-y-auto overflow-x-hidden scrollbar-hide"
                    onPointerDown={() => setIsPaused(true)}
                    onPointerUp={() => setIsPaused(false)}
                    onPointerLeave={() => setIsPaused(false)}
                    onPointerCancel={() => setIsPaused(false)}
                >
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={`content-${activeStory.id}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className="w-full h-full flex items-center justify-center p-2 sm:p-4 z-30"
                        >
                            <motion.div 
                                className="w-full max-h-[95vh] max-w-[98vw] lg:max-w-[96vw] bg-white/[0.05] backdrop-blur-[60px] rounded-[4rem] border border-white/15 flex flex-col items-center p-4 sm:p-12 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] relative overflow-hidden group"
                                layout
                            >
                                {/* Elegant Background Accents */}
                                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[150px] group-hover:bg-white/10 transition-colors duration-1000" />
                                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 blur-[150px] group-hover:bg-white/10 transition-colors duration-1000" />
                                
                                {activeStory.text && (
                                    <div 
                                        className="w-full flex-1 flex flex-col items-center justify-center overflow-y-auto scrollbar-hide px-4 sm:px-16"
                                        style={{ scrollBehavior: 'smooth' }}
                                    >
                                         <p 
                                            className={`font-black text-white leading-[1.6] drop-shadow-[0_15px_50px_rgba(0,0,0,0.4)] break-words whitespace-pre-wrap transition-all duration-700 text-center tracking-tight`}
                                            dir="auto"
                                            style={{ 
                                                fontSize: `clamp(1rem, ${fontSizeMultiplier * (
                                                    activeStory.text.length > 1000 ? 1.4 :
                                                    activeStory.text.length > 600 ? 1.8 :
                                                    activeStory.text.length > 300 ? 2.5 :
                                                    activeStory.text.length > 150 ? 3.8 :
                                                    activeStory.text.length > 80 ? 5.5 :
                                                    8
                                                )}rem, 18rem)`
                                            }}
                                        >
                                            {activeStory.text}
                                        </p>
                                    </div>
                                )}
                                
                                {isImage && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="mt-8 w-full max-w-sm aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-2 border-white/30 relative group/img cursor-pointer shrink-0"
                                        onClick={() => {
                                            setBrowserUrl(activeStory.linkUrl);
                                            setShowBrowser(true);
                                            setIsPaused(true);
                                        }}
                                    >
                                        <img 
                                            src={activeStory.linkUrl} 
                                            alt="Visual Content" 
                                            className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover/img:scale-125"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-2xl border border-white/40 flex items-center justify-center scale-50 group-hover/img:scale-100 transition-transform">
                                                <ExternalLink size={32} className="text-white" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Left/Right Click Areas - Floating above but below controls */}
                    <div className="absolute inset-0 z-10 flex">
                        <div className="w-1/4 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrevStory(); }} />
                        <div className="flex-1" />
                        <div className="w-1/4 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNextStory(); }} />
                    </div>

                    {/* Font Size Side Control Slider */}
                    <div 
                        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-[100] group/slider py-8 px-2 bg-black/20 hover:bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 transition-all opacity-40 hover:opacity-100"
                        onPointerDown={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setFontSizeMultiplier(prev => Math.min(prev + 0.1, 2.5))}
                            className="p-1.5 text-white/50 hover:text-white hover:scale-125 transition-all"
                            title="تكبير الخط"
                        >
                            <RefreshCcw size={20} className="rotate-90" />
                        </button>
                        
                        <div className="h-48 w-1.5 bg-white/10 rounded-full relative group-hover/slider:bg-white/20 transition-colors">
                            <motion.div 
                                className="absolute bottom-0 left-0 right-0 bg-white rounded-full"
                                style={{ height: `${((fontSizeMultiplier - 0.5) / 2) * 100}%` }}
                                layout
                            />
                            {/* Draggable thumb simulation or just display */}
                        </div>

                        <button 
                            onClick={() => setFontSizeMultiplier(prev => Math.max(prev - 0.1, 0.5))}
                            className="p-1.5 text-white/50 hover:text-white hover:scale-125 transition-all"
                            title="تصغير الخط"
                        >
                            <RefreshCcw size={20} className="-rotate-90" />
                        </button>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-4">
                    {isOwner ? (
                        <div className="flex justify-between items-center w-full">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowAnalytics(!showAnalytics); }}
                                className="flex items-center gap-2 text-white bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                            >
                                <Eye size={18} />
                                <span>{activeStory.viewers?.length || 0}</span>
                            </button>
                            <div className="flex gap-3">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                                    className="p-2 text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md relative"
                                >
                                    <MessageCircle size={20} />
                                    {storyComments.length > 0 && <span className="absolute -top-1 -right-1 bg-accent text-[8px] px-1 rounded-full">{storyComments.length}</span>}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteStory(activeStory.id); }}
                                    className="p-2 text-red-500 bg-white/10 rounded-full hover:bg-red-500/20 transition-colors backdrop-blur-md"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                           <div className="flex items-center gap-3 w-full">
                                <div className="flex-1 relative">
                                    <form onSubmit={handleCommentSubmit} className="flex items-center">
                                        <input 
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="أرسل رسالة..."
                                            onFocus={() => setIsPaused(true)}
                                            onBlur={() => setIsPaused(false)}
                                            className="w-full bg-white/10 border border-white/20 rounded-full py-2.5 px-5 text-white text-sm placeholder-white/50 focus:outline-none focus:bg-white/20 transition-all backdrop-blur-md"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!commentText.trim() || isSendingComment}
                                            className="absolute right-2 p-1.5 bg-accent text-white rounded-full disabled:opacity-50 disabled:bg-white/20 transition-all"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStoryLike(activeStory.id);
                                        }}
                                        className={`transition-all transform active:scale-90 ${
                                            activeStory.likes?.includes(currentUser?.id || '')
                                                ? 'text-red-500 scale-110'
                                                : 'text-white hover:scale-110'
                                        }`}
                                    >
                                        <Heart size={28} fill={activeStory.likes?.includes(currentUser?.id || '') ? "currentColor" : "none"} />
                                    </button>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                                        className="text-white hover:scale-110 transition-transform relative"
                                    >
                                        <MessageCircle size={28} />
                                        {storyComments.length > 0 && <span className="absolute -top-1 -right-1 bg-accent text-[8px] px-1 rounded-full">{storyComments.length}</span>}
                                    </button>
                                </div>
                           </div>
                        </div>
                    )}
                </div>

                {/* Comments Panel */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="absolute bottom-0 left-0 right-0 h-[65dvh] bg-zinc-950 rounded-t-[2.5rem] z-[100] border-t border-white/10 shadow-2xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
                            <div className="px-6 py-4 flex justify-between items-center border-b border-white/5">
                                <h3 className="text-white font-bold text-lg">التعليقات</h3>
                                <button onClick={() => setShowComments(false)} className="p-2 text-zinc-400 hover:text-white bg-white/5 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                {storyComments.length > 0 ? (
                                    storyComments.map((comment) => (
                                        <motion.div 
                                            key={comment.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-4"
                                        >
                                            <UserAvatar user={{ id: comment.userId, name: comment.userName, photoURL: comment.userImg }} className="w-10 h-10 border border-white/10" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-white">{comment.userName}</span>
                                                    <span className="text-[10px] text-zinc-500">
                                                        {new Date(comment.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed bg-white/5 p-3 rounded-2xl rounded-tr-none">
                                                    {comment.text}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                        <MessageCircle size={48} className="text-zinc-600 mb-4 opacity-20" />
                                        <p className="text-zinc-500">لا توجد تعليقات بعد</p>
                                        <p className="text-zinc-600 text-xs mt-1">كن أول من يعلق على هذا الاستوري</p>
                                    </div>
                                )}
                            </div>

                            {!isOwner && (
                                <div className="p-4 bg-zinc-900/50 border-t border-white/5">
                                    <form onSubmit={handleCommentSubmit} className="flex gap-3">
                                        <input 
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="أضف تعليقاً..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-full py-2.5 px-5 text-sm text-white focus:outline-none focus:bg-white/10 transition-all"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!commentText.trim() || isSendingComment}
                                            className="p-2.5 bg-accent text-white rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Analytics Panel */}
                <AnimatePresence>
                    {showAnalytics && isOwner && (
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="absolute bottom-0 left-0 right-0 h-[60dvh] bg-zinc-900 rounded-t-3xl z-[60] border-t border-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-white font-bold text-lg">المشاهدات</h3>
                                    <button onClick={() => setShowAnalytics(false)} className="text-zinc-400 hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-4">
                                    {activeStory.viewers?.length ? (
                                        <div className="text-zinc-400 text-sm">
                                            المشاهدات الإجمالية: {activeStory.viewers.length}
                                        </div>
                                    ) : (
                                        <div className="text-center text-zinc-500 py-10">
                                            لا توجد مشاهدات حتى الآن
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showBrowser && browserUrl && (
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            className="absolute inset-0 bg-black z-[100] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Browser Header */}
                            <div className="bg-zinc-900 border-b border-white/10 p-4 flex items-center gap-4">
                                <button onClick={() => { setShowBrowser(false); setIsPaused(false); }} className="text-white bg-white/10 p-2 rounded-full transition-colors hover:bg-white/20">
                                    <X size={20} />
                                </button>
                                <div className="flex-1 bg-black/50 rounded-xl px-4 py-2 flex items-center justify-between gap-3 overflow-hidden border border-white/5">
                                     <div className="flex items-center gap-2 overflow-hidden flex-1">
                                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                         <span className="text-zinc-400 text-[10px] truncate font-mono select-all" dir="ltr">{browserUrl}</span>
                                     </div>
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const iframe = document.querySelector('iframe[title="Browser Mirror"]') as HTMLIFrameElement;
                                            if (iframe) iframe.src = browserUrl;
                                        }}
                                        className="text-zinc-500 hover:text-white transition-colors"
                                     >
                                        <RefreshCcw size={14} />
                                     </button>
                                </div>
                                <a 
                                    href={browserUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-white bg-accent p-2 rounded-full transition-transform hover:scale-110 active:scale-95 shadow-lg shadow-accent/20"
                                >
                                    <ExternalLink size={20} />
                                </a>
                            </div>
                            
                            {/* Browser Body */}
                            <div className="flex-1 bg-white relative overflow-hidden">
                                <iframe 
                                    src={browserUrl} 
                                    className="w-full h-full border-none"
                                    title="Browser Mirror"
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                />
                                {/* Bottom Bar Fallback */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/80 backdrop-blur-xl text-white rounded-full text-[10px] whitespace-nowrap border border-white/10 pointer-events-none opacity-50">
                                     إذا لم يظهر الموقع، استخدم زر السهم في الأعلى
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
