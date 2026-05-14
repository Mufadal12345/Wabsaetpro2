import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Idea, User, IdeaComment, Follow } from "../types";
import { extractYoutubeId, getYoutubeThumbnail } from "../utils";
import { Icons } from "./Icons";
import { UserAvatar } from "./UserAvatar";
import { LinkPreview } from "./LinkPreview";
import { useIdeaLikes } from "../hooks/useAppQueries";
import { addDoc, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../contexts/ToastContext";
import { useData } from "../contexts/DataContext";

import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

interface HomeIdeaListItemProps {
  idea: Idea;
  currentUser: User | null;
  users: User[];
  follows: Follow[];
  comments: IdeaComment[];
  expandedIdeas?: Set<string>;
  toggleExpand?: (e: React.MouseEvent, id: string) => void;
  handleFollow: (e: React.MouseEvent, id: string) => void;
  handleSelectIdea?: (id: string) => void;
  handleViewIdea?: (idea: Idea) => void;
  handleDeleteIdea?: (id: string, authorId: string) => void;
  handleDeleteComment?: (commentId: string, commentUserId: string) => void;
  handleUpdateIdea?: (idea: Idea) => void;
  handlePinIdea?: (idea: Idea) => void;
  playingVideoId: string | null;
  setPlayingVideoId: (id: string | null) => void;
  handleLike: (e: React.MouseEvent, idea: Idea) => void;
  isOwnProfile?: boolean;
}

export const HomeIdeaListItem = React.memo<HomeIdeaListItemProps>(({
  idea,
  currentUser,
  users,
  comments,
  expandedIdeas,
  toggleExpand,
  handleFollow,
  handleSelectIdea,
  handleViewIdea,
  handleDeleteIdea,
  handleDeleteComment,
  handleUpdateIdea,
  handlePinIdea,
  playingVideoId,
  setPlayingVideoId,
  handleLike,
  isOwnProfile
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localCommentText, setLocalCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [localFollowed, setLocalFollowed] = useState(false);
  const queryClient = useQueryClient();

  const { currentUserFollowing } = useData();
  const canViewStats = currentUser && (currentUser.id === idea.authorId || currentUser.role === 'admin' || currentUser.role === 'super_admin');

  const handleSendLocalComment = async () => {
    if (!localCommentText.trim() || !currentUser) return;
    setIsSubmittingComment(true);
    try {
      const tempId = `temp-${Date.now()}`;
      const optimisticComment: IdeaComment = {
        id: tempId,
        ideaId: idea.id,
        text: localCommentText,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        likes: 0,
        likedBy: [],
        parentCommentId: null,
        replies: 0,
        deleted: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(["comments", "all", 50], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p: any, i: number) => {
            if (i === 0) {
              return { ...p, comments: [optimisticComment, ...p.comments] };
            }
            return p;
          })
        };
      });

      await addDoc(collection(db, "comments"), {
        ideaId: idea.id,
        text: localCommentText,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        likes: 0,
        likedBy: [],
        parentCommentId: null,
        replies: 0,
        deleted: false,
        createdAt: new Date().toISOString(),
      });
      
      setLocalCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", "all"] });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "comments");
      showToast("فشل إرسال التعليق", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isFollowing = useMemo(() => currentUserFollowing?.includes(idea.authorId), [currentUserFollowing, idea.authorId]);
  
  const cleanContent = useMemo(() => idea.content.replace(/(https?:\/\/[^\s]+)/g, '').trim(), [idea.content]);
  const isExpanded = expandedIdeas?.has(idea.id) ?? false;
  
  // Dynamic slicing for better UX
  const hasMore = useMemo(() => idea.content.length > 280, [idea.content]);
  
  const { data: isLiked } = useIdeaLikes(idea.id, currentUser?.id);

  const postComments = useMemo(() => {
    return comments.filter((c) => c.ideaId === idea.id && !c.deleted);
  }, [comments, idea.id]);

  const author = useMemo(() => {
    if (currentUser?.id === idea.authorId) return { ...currentUser, role: currentUser.role as any };
    return users.find(u => u.id === idea.authorId) || { id: idea.authorId, name: idea.author, role: idea.authorRole };
  }, [users, idea.authorId, idea.author, idea.authorRole, currentUser]);

  const viewRef = useIntersectionObserver(() => {
    handleViewIdea?.(idea);
  }, { threshold: 0.5, delay: 1000 });

  return (
    <div 
        ref={viewRef as any}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' } as React.CSSProperties}
        className="rounded-3xl overflow-hidden border border-white/5 bg-[#080808] shadow-2xl relative group will-change-transform transform-gpu transition-all duration-500 hover:border-white/10 hover:shadow-accent/5 contain-layout min-h-[200px] mb-1"
    >
      {idea.isPinned && (
        <div className="absolute top-0 left-12 bg-accent/20 px-3 py-1 rounded-b-xl border-x border-b border-accent/30 flex items-center gap-1.5 z-10">
          <Icons.Pin className="w-3 h-3 text-accent fill-current" />
          <span className="text-[10px] font-bold text-accent tracking-tight">منشور مثبت</span>
        </div>
      )}
      
      {/* Post Header */}
      <div className="p-4 flex justify-between items-center bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/[0.02]">
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate(`/profile/${idea.authorId}`)}
            className="w-14 h-14 rounded-full cursor-pointer hover:scale-105 transition-all duration-300"
          >
            <UserAvatar user={author} className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h4
                onClick={() => navigate(`/profile/${idea.authorId}`)}
                className="font-black text-white hover:text-accent cursor-pointer transition-colors text-base"
              >
                {author.name}
              </h4>
              {currentUser && idea.authorId !== currentUser.id && !isFollowing && !localFollowed && (
                <button
                  onClick={(e) => {
                    setLocalFollowed(true);
                    handleFollow(e, idea.authorId);
                  }}
                  className="text-[10px] font-black px-4 py-1 rounded-xl transition-all text-white bg-accent hover:bg-accent/80 border border-accent/20 shadow-lg shadow-accent/10"
                >
                  متابعة
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-bold mt-0.5 flex items-center gap-1.5">
              <Icons.Globe className="w-3 h-3" />
              {new Date(idea.createdAt).toLocaleDateString("ar-EG", {
                dateStyle: "long",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-white/[0.03] px-4 py-1.5 rounded-xl text-zinc-400 border border-white/5 font-black uppercase tracking-widest">
            {idea.category}
          </span>
          
          {(currentUser?.role === "admin" || currentUser?.role === "super_admin" || isOwnProfile || currentUser?.id === idea.authorId) && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-zinc-500 hover:text-white p-2.5 rounded-2xl hover:bg-white/5 transition-all"
              >
                <Icons.MoreHorizontal className="w-5 h-5" />
              </button>

                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute left-0 mt-2 w-48 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-scale-in origin-top-left">
                      {handlePinIdea && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinIdea(idea);
                            setShowMenu(false);
                          }}
                          className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-accent flex items-center justify-between group"
                        >
                          <span>{idea.isPinned ? "إلغاء التثبيت" : "تثبيت المنشور"}</span>
                          <Icons.Pin className={`w-4 h-4 ${idea.isPinned ? 'text-accent fill-current' : 'text-gray-500'}`} />
                        </button>
                      )}
                      
                      {handleUpdateIdea && currentUser?.id === idea.authorId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateIdea?.(idea);
                            setShowMenu(false);
                          }}
                          className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                        >
                          <span>تعديل</span>
                          <Icons.Settings className="w-4 h-4 text-gray-500" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteIdea?.(idea.id, idea.authorId);
                          setShowMenu(false);
                        }}
                        className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-between border-t border-white/5 mt-1 pt-2"
                      >
                        <span>حذف المنشور</span>
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 py-3 cursor-pointer" onClick={() => {
        handleViewIdea?.(idea);
        handleSelectIdea?.(idea.id);
      }}>
        <h3 className="text-xl md:text-2xl font-black text-white mb-2 font-amiri leading-[1.3] tracking-normal group-hover:text-amber-500 transition-colors">
          {idea.title}
        </h3>
        
        {(() => {
          const ytId = extractYoutubeId(idea.content);
          if (ytId) {
            if (playingVideoId === idea.id) {
              return (
                <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-[1rem] overflow-hidden aspect-video bg-black border-y sm:border border-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,1)] will-change-transform transform-gpu">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              );
            }
            return (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setPlayingVideoId(idea.id);
                }}
                className="mb-3 -mx-4 sm:mx-0 sm:rounded-[1rem] overflow-hidden aspect-video bg-black relative group/yt cursor-pointer shadow-2xl min-h-[280px] will-change-transform transform-gpu border-y sm:border border-white/5"
              >
                <img 
                  src={getYoutubeThumbnail(ytId)} 
                  alt="YouTube Thumbnail" 
                  className="w-full h-full object-cover opacity-60 group-hover/yt:opacity-80 group-hover/yt:scale-105 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-[0_0_50px_-10px_rgba(255,70,0,0.5)] group-hover/yt:scale-110 group-hover/yt:bg-orange-500 transition-all duration-500">
                    <Icons.Play className="w-8 h-8 text-white fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 opacity-0 group-hover/yt:opacity-100 transition-opacity">
                  <Icons.PlayCircle className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">تشغيل الفيديو</span>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div className="relative">
          <div className={`text-zinc-300 leading-[1.8] font-tajawal text-[17px] tracking-tight relative overflow-hidden transition-all duration-500 ${!isExpanded ? (hasMore ? 'max-h-40' : 'max-h-[10000px]') : 'max-h-[10000px]'}`}>
            <div className="whitespace-pre-wrap">
              {cleanContent}
            </div>
            
            {hasMore && !isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent pointer-events-none" />
            )}
          </div>

          {hasMore && !isExpanded && (
            <button 
              onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 toggleExpand?.(e, idea.id);
              }}
              className="mt-2 text-amber-500 font-bold hover:text-orange-500 cursor-pointer transition-colors inline-flex items-center gap-1"
            >
              <span>... عرض المزيد</span>
              <Icons.ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {(() => {
          const ytId = extractYoutubeId(idea.content);
          if (!ytId) {
             const firstUrlMatch = idea.content.match(/(https?:\/\/[^\s]+)/);
             if (firstUrlMatch) {
                return <div className="mt-6"><LinkPreview url={firstUrlMatch[0]} /></div>;
             }
          }
          return null;
        })()}

        {idea.hashtags && idea.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mt-6 pt-4 border-t border-white/[0.03]">
            {idea.hashtags.map((tag: string, idx: number) => (
              <span key={idx} className="text-xs font-black text-accent/50 hover:text-accent cursor-pointer transition-colors bg-accent/5 px-3 py-1 rounded-lg border border-accent/10">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {isExpanded && hasMore && toggleExpand && (
          <button
            onClick={(e) => {
               e.stopPropagation();
               toggleExpand(e, idea.id);
            }}
            className="text-zinc-500 text-xs font-black mt-4 hover:text-white transition-colors flex items-center gap-2 group/less"
          >
            <div className="w-6 h-[1px] bg-zinc-800 group-hover/less:w-10 transition-all" />
            إظهار أقل
          </button>
        )}
      </div>

      {/* Post Footer */}
      <div className="px-4 py-3 border-t border-white/[0.03] bg-white/[0.01]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-10">
            <button
              onClick={(e) => handleLike(e, idea)}
              className={`flex items-center gap-2.5 transition-all transform active:scale-95 group/stat ${isLiked ? "text-red-500" : "text-zinc-500 hover:text-red-500"}`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isLiked ? "bg-red-500/10" : "bg-white/[0.03] group-hover/stat:bg-red-500/10"}`}>
                <Icons.Heart
                  className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                />
              </div>
              <span className="font-black text-sm tracking-tighter">
                {canViewStats && (idea.likes || 0)}
              </span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2.5 transition-all group/stat ${showComments ? "text-accent" : "text-zinc-500 hover:text-white"}`}
            >
              <div className={`p-2 rounded-xl transition-colors ${showComments ? "bg-accent/10" : "bg-white/[0.03] group-hover/stat:bg-accent/10"}`}>
                <Icons.Message className="w-5 h-5 rotate-90" />
              </div>
              <span className="font-black text-sm tracking-tighter">
                {canViewStats && postComments.length}
              </span>
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const shareUrl = window.location.origin + `/ideas?ideaId=${idea.id}`;
                  if (navigator.share) {
                    await navigator.share({ title: idea.title, url: shareUrl });
                  } else {
                    await navigator.clipboard.writeText(shareUrl);
                    showToast("تم نسخ الرابط الفكري", "success");
                  }
                } catch (err) { console.error(err); }
              }}
              className="text-zinc-500 hover:text-green-500 transition-all active:scale-95 group/stat"
            >
              <div className="p-2 rounded-xl bg-white/[0.03] group-hover:bg-green-500/10">
                <Icons.Share className="w-5 h-5" />
              </div>
            </button>
          </div>
          {canViewStats && (
            <div className="flex items-center gap-2 text-zinc-600 font-black bg-white/[0.02] px-3 py-1.5 rounded-xl border border-white/[0.03]">
              <Icons.Eye className="w-4 h-4 text-zinc-700" />
              <span className="text-[11px] tracking-tighter">{idea.views || 0}</span>
            </div>
          )}
        </div>

        {/* Local Inline Comment Input */}
        {showComments && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-scale-in origin-top">
          <div className="flex gap-2">
            {currentUser && (
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-sm">
                <UserAvatar user={currentUser} className="w-full h-full" />
              </div>
            )}
            <div className="flex-1 relative">
              <input
                value={localCommentText}
                onChange={(e) => setLocalCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendLocalComment(); }}
                disabled={isSubmittingComment}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-accent transition-all pl-10"
                placeholder="بماذا تفكر؟..."
              />
              <button
                onClick={handleSendLocalComment}
                disabled={isSubmittingComment || !localCommentText.trim()}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-accent disabled:opacity-30 p-1 hover:scale-110 transition-transform"
              >
                <Icons.Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {postComments.length > 0 && (
            <div className="space-y-4 mt-6 max-h-64 overflow-y-auto custom-scrollbar pl-2">
              {postComments.map(c => {
                const commentUser = currentUser?.id === c.userId ? currentUser : users.find(u => u.id === c.userId);
                return (
                <div key={c.id} className="flex gap-3 items-start animate-fade-in group/comment">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/5 bg-zinc-900">
                    <UserAvatar user={commentUser || { id: c.userId, name: c.authorName }} className="w-full h-full" />
                  </div>
                  <div className="flex-1 bg-white/2 border border-white/5 rounded-2xl rounded-tr-none px-4 py-2 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-[11px]">{commentUser?.name || c.authorName}</span>
                      {(currentUser?.id === c.userId || currentUser?.role === "admin" || currentUser?.role === "super_admin") && (
                         <button onClick={() => handleDeleteComment?.(c.id, c.userId)} className="text-red-500/30 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100">
                           <Icons.Trash className="w-3 h-3" />
                         </button>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{c.text}</p>
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  const ideaChanged = prev.idea !== next.idea || prev.idea.likes !== next.idea.likes || prev.idea.views !== next.idea.views || prev.idea.isPinned !== next.idea.isPinned;
  const userChanged = prev.currentUser !== next.currentUser;
  const expandedChanged = prev.expandedIdeas?.has(prev.idea.id) !== next.expandedIdeas?.has(next.idea.id);
  const playingChanged = (prev.playingVideoId === prev.idea.id) !== (next.playingVideoId === next.idea.id);
  
  const prevCommentsCount = prev.comments.filter(c => c.ideaId === prev.idea.id).length;
  const nextCommentsCount = next.comments.filter(c => c.ideaId === next.idea.id).length;
  const commentsChanged = prevCommentsCount !== nextCommentsCount;

  const prevFollow = prev.follows.some(f => f.followerId === prev.currentUser?.id && f.followingId === prev.idea.authorId);
  const nextFollow = next.follows.some(f => f.followerId === next.currentUser?.id && f.followingId === next.idea.authorId);
  const followChanged = prevFollow !== nextFollow;

  return !ideaChanged && !userChanged && !expandedChanged && !playingChanged && !commentsChanged && !followChanged;
});
