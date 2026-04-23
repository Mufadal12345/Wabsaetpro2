import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Idea, User, IdeaComment, Follow } from "../types";
import { extractYoutubeId, getYoutubeThumbnail } from "../utils";
import { Icons } from "./Icons";
import { UserAvatar } from "./UserAvatar";
import { useIdeaLikes } from "../hooks/useAppQueries";

import { useToast } from "../contexts/ToastContext";

interface IdeaListItemProps {
  idea: Idea;
  currentUser: User | null;
  users: User[];
  follows: Follow[];
  comments: IdeaComment[];
  expandedIdeas?: Set<string>;
  toggleExpand?: (e: React.MouseEvent, id: string) => void;
  handleFollow: (e: React.MouseEvent, id: string) => void;
  handleSelectIdea: (id: string) => void;
  setDeletingIdeaId: (id: string | null) => void;
  handleUpdateIdea?: (idea: Idea) => void;
  handlePinIdea?: (idea: Idea) => void;
  playingVideoId: string | null;
  setPlayingVideoId: (id: string | null) => void;
  setCommentText?: (text: string) => void;
  commentText?: string;
  handleSendComment?: () => void;
  setSelectedIdeaId?: (id: string | null) => void;
  handleLike: (e: React.MouseEvent, idea: Idea) => void;
  isOwnProfile?: boolean;
}

export const IdeaListItem: React.FC<IdeaListItemProps> = ({
  idea,
  currentUser,
  users,
  follows,
  comments,
  expandedIdeas,
  toggleExpand,
  handleFollow,
  handleSelectIdea,
  setDeletingIdeaId,
  handleUpdateIdea,
  handlePinIdea,
  playingVideoId,
  setPlayingVideoId,
  setCommentText,
  commentText,
  handleSendComment,
  setSelectedIdeaId,
  handleLike,
  isOwnProfile
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);

  const isFollowing = follows.some(
    (f: Follow) => f.followerId === currentUser?.id && f.followingId === idea.authorId,
  );
  
  const isExpanded = expandedIdeas?.has(idea.id) ?? false;
  const displayContent = isExpanded
    ? idea.content
    : idea.content.slice(0, 300);
  const hasMore = idea.content.length > 300;
  
  const { data: isLiked } = useIdeaLikes(idea.id, currentUser?.id);

  return (
    <div className="glass-card rounded-3xl overflow-hidden border border-white/10 bg-white/5 transition-all shadow-2xl relative group">
      {idea.isPinned && (
        <div className="absolute top-0 left-12 bg-accent/20 backdrop-blur-md px-3 py-1 rounded-b-xl border-x border-b border-accent/30 flex items-center gap-1 z-10">
          <Icons.Pin className="w-3 h-3 text-accent fill-current" />
          <span className="text-[10px] font-bold text-accent">مثبت</span>
        </div>
      )}
      
      {/* Post Header */}
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate(`/profile/${idea.authorId}`)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 p-[2px] cursor-pointer"
          >
            <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
              <UserAvatar user={users.find(u => u.id === idea.authorId) || { id: idea.authorId, name: idea.author }} className="w-full h-full" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4
                onClick={() => navigate(`/profile/${idea.authorId}`)}
                className="font-bold text-white hover:text-accent cursor-pointer transition-colors"
              >
                {idea.author}
              </h4>
              {idea.authorRole === "admin" && (
                <Icons.Crown className="w-3 h-3 text-yellow-400" />
              )}
              {currentUser && idea.authorId !== currentUser.id && (
                <button
                  onClick={(e) => handleFollow(e, idea.authorId)}
                  className={`text-[10px] font-bold px-3 py-0.5 rounded-full transition-all ${isFollowing ? "text-gray-500 border border-white/10" : "text-accent border border-accent/30 hover:bg-accent/10"}`}
                >
                  {isFollowing ? "متابع" : "متابعة"}
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              {new Date(idea.createdAt).toLocaleDateString("ar-EG", {
                dateStyle: "medium",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-400 border border-white/10">
            {idea.category}
          </span>
          
          {(currentUser?.role === "admin" || isOwnProfile || currentUser?.id === idea.authorId) && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع.")) {
                    setDeletingIdeaId(idea.id);
                  }
                }}
                title="حذف المنشور"
                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
              >
                <Icons.Trash className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <Icons.MoreHorizontal className="w-5 h-5" />
                </button>
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute left-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-scale-in origin-top-left">
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
                      {handleUpdateIdea && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateIdea(idea);
                            setShowMenu(false);
                          }}
                          className="w-full text-right px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                        >
                          <span>تعديل</span>
                          <Icons.Settings className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4 cursor-pointer" onClick={() => handleSelectIdea(idea.id)}>
        <h3 className="text-xl font-bold text-white mb-3 font-amiri leading-tight">
          {idea.title}
        </h3>
        
        {(() => {
          const ytId = extractYoutubeId(idea.content);
          if (ytId) {
            if (playingVideoId === idea.id) {
              return (
                <div className="mb-4 rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-2xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              );
            }
            return (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setPlayingVideoId(idea.id);
                }}
                className="mb-4 rounded-2xl overflow-hidden aspect-video bg-black relative group/yt cursor-pointer"
              >
                <img 
                  src={getYoutubeThumbnail(ytId)} 
                  alt="YouTube Thumbnail" 
                  className="w-full h-full object-cover opacity-80 group-hover/yt:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/yt:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-2xl shadow-red-600/40 group-hover/yt:scale-110 transition-transform duration-300">
                    <Icons.Play className="w-10 h-10 text-white fill-current" />
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div className="text-gray-300 leading-relaxed font-tajawal whitespace-pre-wrap">
          {displayContent}
          {hasMore && !isExpanded && "..."}
        </div>

        {idea.hashtags && idea.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {idea.hashtags.map((tag: string, idx: number) => (
              <span key={idx} className="text-xs font-bold text-accent hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {hasMore && toggleExpand && expandedIdeas && (
          <button
            onClick={(e) => toggleExpand(e, idea.id)}
            className="text-accent text-sm font-bold mt-2 hover:underline"
          >
            {isExpanded ? "عرض أقل" : "عرض المزيد"}
          </button>
        )}
      </div>

      {/* Post Footer */}
      <div className="px-6 py-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => handleLike(e, idea)}
              className={`flex items-center gap-2 transition-all transform active:scale-90 ${isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}
            >
              <Icons.Heart
                className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
              />
              <span className="font-bold text-sm">{idea.likes || 0}</span>
            </button>
            <button
              onClick={() => handleSelectIdea(idea.id)}
              className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
            >
              <Icons.Message className="w-5 h-5 rotate-90" />
              <span className="font-bold text-sm">
                {comments.filter((c) => c.ideaId === idea.id && !c.deleted).length}
              </span>
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: idea.title,
                      text: idea.content.substring(0, 100),
                      url: window.location.origin + `/ideas?ideaId=${idea.id}`,
                    });
                  } else {
                    await navigator.clipboard.writeText(window.location.origin + `/ideas?ideaId=${idea.id}`);
                    showToast("تم نسخ رابط الفكرة", "success");
                  }
                } catch (err) {
                  console.error("Share failed:", err);
                }
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-green-400 transition-colors"
              title="مشاركة"
            >
              <Icons.Share className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <Icons.Eye className="w-4 h-4" />
            <span>{idea.views || 0}</span>
          </div>
        </div>

        {/* Comment Input */}
        {setCommentText && handleSendComment && setSelectedIdeaId && (
          <div className="flex gap-3">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSelectedIdeaId(idea.id);
                  handleSendComment();
                }
              }}
              className="input-style flex-1 rounded-full px-6 py-2 text-sm"
              placeholder="اكتب تعليقاً..."
            />
            <button
              onClick={() => {
                setSelectedIdeaId(idea.id);
                handleSendComment();
              }}
              className="w-10 h-10 bg-accent rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Icons.Send className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
