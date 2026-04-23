import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { Idea, User, IdeaComment } from "../types";
import { parseHashtags } from "../utils";
import { Modal } from "./admin/Modal";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  increment,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Icons } from "../components/Icons";
import { CardSkeleton } from "../components/Skeletons";
import { UserAvatar } from "../components/UserAvatar";
import { IdeaListItem } from "../components/IdeaListItem";
import { useIdeas, useIdeaLikes } from "../hooks/useAppQueries";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

interface IdeaDetailModalProps {
  idea: Idea;
  currentUser: User | null;
  comments: IdeaComment[];
  navigate: (path: string) => void;
  setSelectedIdeaId: (id: string | null) => void;
  handleLike: (e: React.MouseEvent, idea: Idea) => void;
}

function IdeaDetailModal({ idea, currentUser, comments, navigate, setSelectedIdeaId, handleLike }: IdeaDetailModalProps) {
  const { data: isLiked } = useIdeaLikes(idea.id, currentUser?.id);

  return (
    <div className="max-w-3xl mx-auto pt-10">
      <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold mb-6 border border-accent/30 tracking-wide">
        {idea.category}
      </span>

      <h1 className="text-4xl md:text-6xl font-bold font-amiri text-white mb-8 leading-tight neon-text">
        {idea.title}
      </h1>

      <div className="flex items-center gap-4 mb-10 pb-10 border-b border-white/10">
        <div
          onClick={() => {
            setSelectedIdeaId(null);
            navigate(`/profile/${idea.authorId}`);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px] shadow-xl cursor-pointer"
        >
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
            <UserAvatar user={{ id: idea.authorId, name: idea.author }} className="w-full h-full" />
          </div>
        </div>
        <div>
          <h4
            onClick={() => {
              setSelectedIdeaId(null);
              navigate(`/profile/${idea.authorId}`);
            }}
            className="font-bold text-white text-xl hover:text-accent cursor-pointer transition-colors"
          >
            {idea.author}
          </h4>
          <p className="text-sm text-gray-400 font-tajawal">
            {new Date(idea.createdAt).toLocaleDateString("ar-EG", {
              dateStyle: "long",
            })}
          </p>
        </div>
      </div>

      <div className="prose prose-invert prose-xl max-w-none font-amiri leading-relaxed text-gray-200 mb-8 whitespace-pre-wrap">
        {idea.content}
      </div>

      <div className="flex items-center gap-8 py-8 border-t border-b border-white/10">
        <button
          onClick={(e) => handleLike(e, idea)}
          className={`flex items-center gap-3 text-xl font-bold transition-all transform active:scale-90 ${isLiked ? "text-red-500" : "text-white hover:text-red-500"}`}
        >
          <Icons.Heart
            className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`}
          />
          <span>{idea.likes || 0}</span>
        </button>
        <div className="flex items-center gap-3 text-xl text-white font-bold">
          <Icons.Message className="w-6 h-6 rotate-90" />
          <span>{comments.filter((c: IdeaComment) => c.ideaId === idea.id && !c.deleted).length}</span>
        </div>
        <div className="flex items-center gap-3 text-xl text-white font-bold">
          <Icons.Eye className="w-6 h-6" />
          <span>{idea.views || 0}</span>
        </div>
      </div>
    </div>
  );
}

export const Ideas: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useIdeas(10);
  const { aboutSections, comments, users, follows } = useData();
  const { showToast } = useToast();

  const loadMoreRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  });
  
  // New paginated data
  const rawIdeas = useMemo(() => {
    return data?.pages.flatMap(page => page.ideas) ?? [];
  }, [data]);

  const ideas = rawIdeas;
  const loadingMoreIdeas = isLoading;

  const [filter, setFilter] = useState("الكل");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy] = useState<"newest" | "popular" | "featured">("newest");
  const navigate = useNavigate();
  // Dynamic categories for filtering
  const categories = useMemo(() => {
    const base = ["الكل", "فلسفة", "تعليم", "تكنولوجيا", "فن", "تطوير المهارات", "أخرى"];
    const sectionTitles = aboutSections
      .filter(s => s.isVisible && !s.isProjectInfo)
      .map(s => s.title);
    return Array.from(new Set([...base, ...sectionTitles]));
  }, [aboutSections]);

  const CATEGORY_ICONS_MAP: Record<string, any> = {
    الكل: Icons.Layout,
    فلسفة: Icons.BookOpen,
    تعليم: Icons.GraduationCap,
    تكنولوجيا: Icons.Cpu,
    فن: Icons.Palette,
    "تطوير المهارات": Icons.Zap,
    أخرى: Icons.MoreHorizontal,
  };

  // Filtered Ideas Logic
  const visibleIdeas = useMemo(() => {
    let all = [...rawIdeas];
    
    // Sort logic here ... keeping original logic but applied to 'all'
    all.sort((a, b) => {
       const dateA = new Date(a.createdAt).getTime();
       const dateB = new Date(b.createdAt).getTime();
       return (dateB || 0) - (dateA || 0);
    });

    if (filter !== "الكل") {
      all = all.filter((i) => i.category === filter);
    }

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      all = all.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(lowerTerm)) ||
          (i.content && i.content.toLowerCase().includes(lowerTerm)) ||
          (i.author && i.author.toLowerCase().includes(lowerTerm)),
      );
    }
    return all;
  }, [rawIdeas, filter, searchTerm, sortBy]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("أخرى");
  const [content, setContent] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 20);
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIdeas);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIdeas(newExpanded);
  };

  const handleFollow = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast("يجب تسجيل الدخول للمتابعة", "info");
      return;
    }
    if (currentUser.id === targetUserId) return;

    const isFollowing = follows.some(
      (f) => f.followerId === currentUser.id && f.followingId === targetUserId,
    );

    try {
      if (isFollowing) {
        const q = query(
          collection(db, "follows"),
          where("followerId", "==", currentUser.id),
          where("followingId", "==", targetUserId),
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, "follows", d.id));
        }

        await updateDoc(doc(db, "users", targetUserId), {
          followersCount: increment(-1),
        });
        await updateDoc(doc(db, "users", currentUser.id), {
          followingCount: increment(-1),
        });
      } else {
        await addDoc(collection(db, "follows"), {
          followerId: currentUser.id,
          followingId: targetUserId,
          createdAt: new Date().toISOString(),
        });

        await updateDoc(doc(db, "users", targetUserId), {
          followersCount: increment(1),
        });
        await updateDoc(doc(db, "users", currentUser.id), {
          followingCount: increment(1),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "follows/users");
      showToast("حدث خطأ", "error");
    }
  };

  const handleSelectIdea = async (id: string) => {
    setSelectedIdeaId(id);
    if (currentUser && !id.startsWith("static")) {
      const idea = ideas.find((i) => i.id === id);
      if (idea) {
        try {
          const viewRef = doc(db, "ideas", id, "views", currentUser.id);
          const viewDoc = await getDoc(viewRef);
          if (!viewDoc.exists()) {
            await setDoc(viewRef, { createdAt: new Date().toISOString() });
            await updateDoc(doc(db, "ideas", id), {
              views: increment(1)
            });
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !selectedIdeaId || !currentUser) return;
    try {
      await addDoc(collection(db, "comments"), {
        ideaId: selectedIdeaId,
        text: commentText,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        likes: 0,
        likedBy: [],
        parentCommentId: replyingToCommentId,
        replies: 0,
        deleted: false,
        createdAt: new Date().toISOString(),
      });
      setCommentText("");
      setReplyingToCommentId(null);
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      showToast("تم إضافة التعليق", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "comments");
      showToast("فشل إرسال التعليق", "error");
    }
  };

  const handleSubmit = async () => {
    if (!title || !content || !currentUser) return;
    try {
      const hashtags = parseHashtags(content);
      await addDoc(collection(db, "ideas"), {
        title,
        category,
        content,
        hashtags,
        author: currentUser.name,
        authorId: currentUser.id,
        authorRole: currentUser.role,
        views: 0,
        likes: 0,
        featured: false,
        deleted: false,
        createdAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      showToast("تم إضافة الفكرة بنجاح", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "ideas");
      showToast("حدث خطأ أثناء النشر", "error");
    }
  };

  const handleLike = async (e: React.MouseEvent, idea: any) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast("يجب تسجيل الدخول للإعجاب", "info");
      return;
    }

    try {
      if (idea.id.startsWith("static")) {
        await setDoc(doc(db, "ideas", idea.id), {
          ...idea,
          likes: 1,
          views: (idea.views || 0) + 1,
          promotedFromStatic: true,
        });
      } else {
        const likeRef = doc(db, "ideas", idea.id, "likes", currentUser.id);
        const likeDoc = await getDoc(likeRef);
        const isLiked = likeDoc.exists();

        if (isLiked) {
          await deleteDoc(likeRef);
          await updateDoc(doc(db, "ideas", idea.id), {
            likes: increment(-1)
          });
        } else {
          await setDoc(likeRef, { createdAt: new Date().toISOString() });
          await updateDoc(doc(db, "ideas", idea.id), {
            likes: increment(1)
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["idea-likes", idea.id] });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "ideas");
      showToast("حدث خطأ", "error");
    }
  };

  return (
    <div className="animate-fade-in font-tajawal">
      {/* Sticky Header with Search and Categories */}
      <header 
        className={`sticky top-0 z-40 bg-[#0a0f1f]/90 backdrop-blur-xl shadow-2xl border-b border-white/5 transition-all duration-300 ${isScrolled ? 'py-1' : 'py-2'}`}
      >
        <div className="max-w-2xl mx-auto px-4 space-y-2">
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 opacity-0 mb-0' : 'h-auto opacity-100'}`}>
            <div className="flex-1">
            </div>

            <div className="flex gap-4 items-center bg-white/5 p-2 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-sm scale-90 py-1">
              <div 
                onClick={() => navigate(`/profile/${currentUser?.id}`)}
                className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px] cursor-pointer shadow-lg hover:scale-105 transition-transform"
              >
                <div className="w-full h-full rounded-full bg-[#0a0f1f] flex items-center justify-center overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Icons.User className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 text-right px-4 md:px-6 py-2 md:py-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 text-xs md:text-sm font-bold transition-all border border-white/5 hover:border-white/20 shadow-inner flex justify-between items-center group"
              >
                <span className="truncate">بماذا تفكر يا {currentUser?.name?.split(' ')[0] || "مبدع"}؟</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-accent to-orange-500 flex items-center justify-center shadow-lg group-hover:rotate-90 transition-transform duration-500">
                    <Icons.Plus className="w-4 h-4 md:w-4 md:h-4 text-white" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group flex items-center gap-2">
              {isScrolled && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-orange-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                >
                  <Icons.Plus className="w-5 h-5 text-white" />
                </button>
              )}
              <div className="relative flex-1">
                <Icons.Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-accent transition-colors" />
                <input
                  type="text"
                  placeholder="ابحث عن فكرة أو هاشتاج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-style w-full pr-12 pl-4 py-2 rounded-2xl text-sm bg-white/5 border-white/10 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
            
            <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS_MAP[cat] || Icons.MoreHorizontal;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3 py-1 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all text-xs font-bold ${
                      filter === cat
                        ? "bg-gradient-to-r from-accent to-orange-500 text-white shadow-lg shadow-accent/20"
                        : "glass hover:bg-white/10 text-gray-400"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {cat}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Floating Action Button Removed as requested */}

      <div className="max-w-2xl mx-auto space-y-6">
        {loadingMoreIdeas && ideas.length === 0 ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          visibleIdeas.map((idea) => {
            return <IdeaListItem 
              key={idea.id} 
              idea={idea} 
              currentUser={currentUser}
              users={users}
              follows={follows}
              comments={comments}
              expandedIdeas={expandedIdeas}
              toggleExpand={toggleExpand}
              handleFollow={handleFollow}
              handleSelectIdea={handleSelectIdea}
              setDeletingIdeaId={setDeletingIdeaId}
              playingVideoId={playingVideoId}
              setPlayingVideoId={setPlayingVideoId}
              setCommentText={setCommentText}
              commentText={commentText}
              handleSendComment={handleSendComment}
              setSelectedIdeaId={setSelectedIdeaId}
              handleLike={handleLike}
              isOwnProfile={idea.authorId === currentUser?.id}
            />;
          })
        )}

        <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center mt-4">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-accent">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold">جاري تحميل المزيد...</span>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="✨ إضافة منشور جديد"
      >
        <div className="space-y-6 font-tajawal pb-10">
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-indigo-500 p-[3px] shadow-lg shadow-accent/20">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-black">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icons.User className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white text-xl">{currentUser?.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/5 flex items-center gap-1">
                    <Icons.Globe className="w-3 h-3" /> مشاركة عامة
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="عنوان المنشور (اختياري)..."
                className="input-style w-full px-4 py-4 rounded-2xl font-bold text-2xl border-none bg-transparent focus:ring-0 placeholder:text-gray-700 text-white"
              />
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4" />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ماذا يدور في ذهنك؟ (يمكنك إضافة روابط يوتيوب أو مواقع)"
                className="input-style w-full px-4 py-4 rounded-2xl h-72 resize-none leading-relaxed border-none bg-transparent focus:ring-0 placeholder:text-gray-700 text-xl text-gray-200"
              ></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-gray-500 text-xs font-bold mr-4">تصنيف المنشور</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-style w-full px-6 py-4 rounded-2xl appearance-none bg-white/5 border border-white/10 font-bold text-base shadow-lg"
              >
                {Object.keys(CATEGORY_ICONS_MAP).filter(c => c !== "الكل").map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                className="btn-primary w-full py-4 rounded-2xl font-bold text-xl shadow-2xl shadow-accent/30 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                <span>نشر الآن</span>
                <Icons.Share className="w-6 h-6 group-hover:translate-x-[-4px] transition-transform" />
              </button>
            </div>
          </div>
          
          <div className="text-center text-gray-500 text-xs pt-4 flex items-center justify-center gap-2">
            <Icons.ShieldCheck className="w-4 h-4" />
            <p>سيظهر المنشور في الخلاصة العامة لجميع المستخدمين</p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingIdeaId}
        onClose={() => setDeletingIdeaId(null)}
        title="تأكيد الحذف"
      >
        <div className="p-4 text-center">
          <p className="text-white mb-6">هل أنت متأكد من حذف هذه الفكرة؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={async () => {
                if (!deletingIdeaId || !currentUser) return;
                const id = deletingIdeaId;
                const ideaToDelete = ideas.find(i => i.id === id);
                console.log("Deleting idea:", id, "authorId:", ideaToDelete?.authorId, "currentUser:", currentUser?.id);
                
                setDeletingIdeaId(null);
                try {
                  await deleteDoc(doc(db, "ideas", id));
                  queryClient.invalidateQueries({ queryKey: ["ideas"] });
                  showToast("تم حذف الفكرة بنجاح", "success");
                } catch (err) {
                  handleFirestoreError(err, OperationType.DELETE, "ideas");
                  showToast("حدث خطأ أثناء الحذف", "error");
                }
              }}
              className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/20"
            >
              حذف نهائي
            </button>
          </div>
        </div>
      </Modal>

      {/* Idea Detail Modal (Overlay) */}
      {selectedIdeaId && (
        <div className="fixed inset-0 z-[60] bg-[#0f1020]/95 backdrop-blur-xl flex flex-col animate-fade-in font-tajawal overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setSelectedIdeaId(null)}
            className="fixed top-[calc(1rem+env(safe-area-inset-top,0px))] left-4 z-[70] w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition shadow-lg"
          >
            <Icons.X className="w-5 h-5" />
          </button>

          <div className="flex-1 p-6 md:p-12 relative pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
            {(() => {
              const idea = rawIdeas.find((i) => i.id === selectedIdeaId);
              if (!idea) return null;
              const currentComments = comments.filter(
                (c) => c.ideaId === selectedIdeaId && !c.deleted,
              );

              return (
                <div key={idea.id}>
                  <IdeaDetailModal idea={idea} currentUser={currentUser} comments={comments} navigate={navigate} setSelectedIdeaId={setSelectedIdeaId} handleLike={handleLike} />
                  {/* Comments Section */}
                  <div className="mt-10">
                    <h3 className="font-bold text-2xl text-white mb-6">التعليقات</h3>
                    <div className="space-y-6 mb-10">
                      {currentComments.filter(c => !c.parentCommentId).map((comment, index) => (
                        <CommentItem 
                          key={`${comment.id}-${index}`} 
                          comment={comment} 
                          allComments={currentComments} 
                          onReply={(id) => setReplyingToCommentId(id)}
                        />
                      ))}
                      {currentComments.length === 0 && (
                        <p className="text-gray-500 text-center py-4">لا توجد تعليقات بعد</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sticky bottom-6 bg-[#0f1020]/80 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                      {replyingToCommentId && (
                        <div className="flex justify-between items-center text-xs text-accent px-2">
                          <span>رد على تعليق</span>
                          <button onClick={() => setReplyingToCommentId(null)}><Icons.X className="w-3 h-3"/></button>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                          className="input-style flex-1 rounded-full px-6 py-3"
                          placeholder={replyingToCommentId ? "اكتب رداً..." : "اكتب تعليقاً..."}
                        />
                        <button
                          onClick={handleSendComment}
                          className="w-12 h-12 bg-accent rounded-full text-white flex items-center justify-center shadow-lg shadow-accent/20 hover:scale-110 transition-transform"
                        >
                          <Icons.Send className="w-5 h-5 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

const CommentItem: React.FC<{ comment: IdeaComment, allComments: IdeaComment[], onReply: (id: string) => void }> = ({ comment, allComments, onReply }) => {
  const replies = allComments.filter(c => c.parentCommentId === comment.id);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 group">
        <div
          onClick={() => navigate(`/profile/${comment.userId}`)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white border border-white/10 cursor-pointer"
        >
          {comment.authorName[0]}
        </div>
        <div className="flex-1">
          <div className="bg-white/5 p-4 rounded-3xl rounded-tr-none border border-white/5 group-hover:bg-white/10 transition-colors">
            <span
              onClick={() => navigate(`/profile/${comment.userId}`)}
              className="font-bold text-sm text-accent block mb-1 cursor-pointer hover:underline"
            >
              {comment.authorName}
            </span>
            <p className="text-gray-200 leading-relaxed">{comment.text}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 mr-2">
            <span className="text-[10px] text-gray-500 font-mono">
              {new Date(comment.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button onClick={() => onReply(comment.id)} className="text-[10px] text-accent font-bold hover:underline">رد</button>
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="mr-12 space-y-4 border-r border-white/10 pr-4">
          {replies.map((reply, index) => (
            <CommentItem key={`${reply.id}-${index}`} comment={reply} allComments={allComments} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
};
