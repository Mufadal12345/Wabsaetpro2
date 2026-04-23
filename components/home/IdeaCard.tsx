import React, { useState } from "react";
import { Idea, User } from "../../types";
import { UserAvatar } from "../UserAvatar";
import { Icons } from "../Icons";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useIdeaLikes } from "../../hooks/useAppQueries";
import { updateDoc, doc, increment, addDoc, collection, setDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { useQueryClient } from "@tanstack/react-query";

interface IdeaCardProps {
  idea: Idea;
  author: User | undefined;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, author }) => {
  const { currentUser } = useAuth();
  const { comments } = useData();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ideaComments = comments.filter((c) => c.ideaId === idea.id && !c.deleted)
    .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  const { data: isLiked } = useIdeaLikes(idea.id, currentUser?.id);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    const ideaRef = doc(db, "ideas", idea.id);
    const likeRef = doc(db, "ideas", idea.id, "likes", currentUser.id);

    // Optimistic UI updates
    queryClient.setQueryData(["idea-likes", idea.id, currentUser.id], !isLiked);
    
    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(ideaRef, { likes: increment(-1) });
      } else {
        await setDoc(likeRef, { createdAt: new Date().toISOString() });
        await updateDoc(ideaRef, { likes: increment(1) });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      // Revert on failure
      queryClient.setQueryData(["idea-likes", idea.id, currentUser.id], isLiked);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !currentUser || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
       await addDoc(collection(db, "comments"), {
        ideaId: idea.id,
        text: commentText.trim(),
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
      setCommentText("");
      showToast("تم صياغة التعليق", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "comments");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentPreview = idea.content.length > 250 && !isExpanded
    ? idea.content.substring(0, 250) + "..."
    : idea.content;

  return (
    <div className="glass-card rounded-[2rem] p-6 mb-6 card-hover border border-white/5 transition-all text-right shadow-lg flex flex-col relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-accent/20 to-transparent"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <UserAvatar user={author || { id: idea.authorId, name: idea.author }} className="w-12 h-12" />
          <div>
            <h3 className="font-bold text-white text-lg leading-none mb-1 hover:text-accent cursor-pointer transition-colors">{idea.author}</h3>
            {author && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                <Icons.Award className="w-3 h-3 text-accent" />
                مستوى {Math.floor((author.followersCount || 0) / 10) + 1}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {idea.category && idea.category !== "أخرى" && (
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 text-accent border border-white/5 shadow-sm">
              {idea.category}
            </span>
          )}
          <span className="text-[10px] text-gray-500 font-mono">
            {new Date(idea.createdAt).toLocaleDateString("ar-EG")}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="mb-6">
        <h4 className="font-bold text-xl mb-3 text-white font-amiri leading-tight hover:text-accent transition-colors cursor-pointer">
          {idea.title}
        </h4>
        <p className="text-gray-300 leading-relaxed font-tajawal whitespace-pre-wrap text-sm md:text-base">
          {contentPreview}
        </p>
        
        {idea.hashtags && idea.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 block">
            {idea.hashtags.map((tag, idx) => (
              <span key={idx} className="text-xs font-bold text-accent cursor-pointer hover:underline bg-accent/5 px-2 py-1 rounded-lg">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {idea.content.length > 250 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-accent text-sm font-bold mt-3 hover:underline inline-block"
          >
            {isExpanded ? "عرض أقل" : "عرض المزيد"}
          </button>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-transform transform active:scale-95 ${
              isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500 hover:bg-red-500/10"
            } px-2 py-1 rounded-lg`}
          >
            <Icons.Heart className={`w-5 h-5 ${isLiked ? "fill-current scale-110 transition-transform" : ""}`} />
            <span className="text-sm font-bold">{idea.likes || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 transition-colors active:scale-95 px-2 py-1 rounded-lg ${
                showComments ? "text-blue-400 bg-blue-400/10" : "text-gray-500 hover:text-blue-400 hover:bg-blue-400/10"
            }`}
          >
            <Icons.Message className="w-5 h-5" />
            <span className="text-sm font-bold">{ideaComments.length}</span>
          </button>
          
          <button
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: idea.title,
                    text: idea.content.substring(0, 100),
                    url: window.location.origin + `/ideas/${idea.id}`,
                  });
                } else {
                  await navigator.clipboard.writeText(window.location.origin + `/ideas/${idea.id}`);
                  showToast("تم نسخ رابط الفكرة", "success");
                }
              } catch (err) {
                console.error("Share failed:", err);
              }
            }}
            className="flex items-center gap-1.5 text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-colors active:scale-95 px-2 py-1 rounded-lg"
          >
            <Icons.Share className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-gray-600 text-xs px-2">
          <Icons.Eye className="w-4 h-4" />
          <span>{idea.views || 0}</span>
        </div>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in text-right">
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
             {ideaComments.length > 0 ? (
                 ideaComments.map(c => (
                     <div key={c.id} className="flex gap-3 bg-white/5 p-3 rounded-2xl">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-xs flex-shrink-0 text-white font-bold">
                           {c.authorName?.[0]}
                         </div>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white">{c.authorName}</span>
                                <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleDateString("ar-EG")}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed font-tajawal">{c.text}</p>
                         </div>
                     </div>
                 ))
             ) : (
                <p className="text-xs text-gray-500 text-center py-2">لا توجد تعليقات بعد. كن أول من يعلق!</p>
             )}
          </div>
          {currentUser && (
               <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                      placeholder="اكتب تعليقاً..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 transition-colors"
                    />
                    <button 
                       onClick={handleSendComment}
                       disabled={!commentText.trim() || isSubmitting}
                       className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                       <Icons.Send className="w-4 h-4 ml-1" />
                    </button>
               </div>
          )}
        </div>
      )}
    </div>
  );
};
