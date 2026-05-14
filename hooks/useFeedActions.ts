import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { Idea, SocialRelation } from "../types";
import { parseHashtags } from "../utils";
import { 
  useCreateIdea, 
  useUpdateIdea, 
  useDeleteIdea, 
  useLikeIdea 
} from "../src/features/ideas/hooks/useIdeaActions";
import {
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  increment,
  getDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export const useFeedActions = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { comments, users, follows } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("أخرى");
  const [content, setContent] = useState("");
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [viewersThatAlreadySeenLocal, setViewersThatAlreadySeenLocal] = useState<Set<string>>(() => {
    try {
      const cached = localStorage.getItem('viewed_ideas_session');
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Helper to persist viewed ideas
  const markIdeaAsViewedLocally = (id: string) => {
    setViewersThatAlreadySeenLocal(prev => {
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem('viewed_ideas_session', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  };

  const { mutateAsync: deleteIdea } = useDeleteIdea();
  
  const handleDeleteIdea = async (id: string, authorId: string) => {
    if (!currentUser) return;
    if (authorId !== currentUser.id && currentUser.role !== "admin" && currentUser.role !== "super_admin") {
      showToast("لا تملك صلاحية الحذف", "error");
      return;
    }
    
    try {
      await deleteIdea(id);
      showToast("تم حذف الفكرة بنجاح", "success");
    } catch (err) {
      showToast("فشل تنفيذ العملية", "error");
    }
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!currentUser) return;
    if (commentUserId !== currentUser.id && currentUser.role !== "admin" && currentUser.role !== "super_admin") {
      showToast("لا تملك صلاحية الحذف", "error");
      return;
    }

    await queryClient.cancelQueries({ queryKey: ["comments"] });
    const previousComments = queryClient.getQueryData(["comments", "all", 50]);

    try {
      queryClient.setQueryData(["comments", "all", 50], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages?.map((p: any) => ({
            ...p,
            comments: p.comments.filter((c: any) => c.id !== commentId),
          })),
        };
      });

      await deleteDoc(doc(db, "comments", commentId));
      showToast("تم حذف التعليق بنجاح", "success");
    } catch (e) {
      queryClient.setQueryData(["comments", "all", 50], previousComments);
      handleFirestoreError(e, OperationType.DELETE, "comments");
      showToast("فشل تنفيذ العملية", "error");
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["comments"] });
    }
  };

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

    try {
      // Optimistic update using cached data first for instant UI response
      const cachedSocial: any = queryClient.getQueryData(["social", currentUser.id]);
      const isAlreadyFollowing = cachedSocial?.following?.includes(targetUserId);

      if (cachedSocial) {
        queryClient.setQueryData(["social", currentUser.id], (old: any) => {
          if (!old) return old;
          const newFollowing = isAlreadyFollowing 
            ? old.following.filter((id: string) => id !== targetUserId)
            : [...old.following, targetUserId];
          return { ...old, following: newFollowing };
        });
      }

      const mySocialRef = doc(db, "social", currentUser.id);
      const targetSocialRef = doc(db, "social", targetUserId);

      const [mySnap, targetSnap] = await Promise.all([
        getDoc(mySocialRef),
        getDoc(targetSocialRef)
      ]);

      const mySocial = mySnap.exists() ? mySnap.data() as SocialRelation : { followers: [] as string[], following: [] as string[] } as SocialRelation;
      const targetSocial = targetSnap.exists() ? targetSnap.data() as SocialRelation : { followers: [] as string[], following: [] as string[] } as SocialRelation;

      const isFollowing = mySocial.following.includes(targetUserId);

      // Fix optimistic update if local cache was wrong or missing
      if (!cachedSocial || isFollowing !== isAlreadyFollowing) {
        queryClient.setQueryData(["social", currentUser.id], (old: any) => {
          if (!old) return old;
          const newFollowing = isFollowing 
            ? old.following.filter((id: string) => id !== targetUserId)
            : [...old.following, targetUserId];
          return { ...old, following: newFollowing };
        });
      }

      if (isFollowing) {
        // Unfollow
        await Promise.all([
          setDoc(mySocialRef, {
            ...mySocial,
            following: mySocial.following.filter((id: string) => id !== targetUserId)
          }, { merge: true }),
          setDoc(targetSocialRef, {
            ...targetSocial,
            followers: targetSocial.followers.filter((id: string) => id !== currentUser.id)
          }, { merge: true }),
          updateDoc(doc(db, "users", targetUserId), { followersCount: increment(-1) }),
          updateDoc(doc(db, "users", currentUser.id), { followingCount: increment(-1) })
        ]);
      } else {
        // Follow
        await Promise.all([
          setDoc(mySocialRef, {
            ...mySocial,
            following: [...mySocial.following, targetUserId]
          }, { merge: true }),
          setDoc(targetSocialRef, {
            ...targetSocial,
            followers: [...targetSocial.followers, currentUser.id]
          }, { merge: true }),
          updateDoc(doc(db, "users", targetUserId), { followersCount: increment(1) }),
          updateDoc(doc(db, "users", currentUser.id), { followingCount: increment(1) })
        ]);
      }
      queryClient.invalidateQueries({ queryKey: ["social"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "social/users");
      showToast("حدث خطأ", "error");
    }
  };

  const handleStoryView = async (storyId: string) => {
    if (!currentUser || !storyId) return;
    try {
      const storyRef = doc(db, "stories", storyId);
      const storySnap = await getDoc(storyRef);
      if (storySnap.exists()) {
        const data = storySnap.data();
        const viewers = data.viewers || [];
        if (!viewers.includes(currentUser.id)) {
          await updateDoc(storyRef, {
            viewers: arrayUnion(currentUser.id)
          });
          queryClient.invalidateQueries({ queryKey: ["stories"] });
        }
      }
    } catch (err) {
      console.error("Story view error:", err);
    }
  };

  const handleViewIdea = async (idea: Idea) => {
    if (!idea.id || idea.id.startsWith("static")) return;
    
    // Check local tracking first to prevent unnecessary DB check/write
    if (viewersThatAlreadySeenLocal.has(idea.id)) return;

    try {
      const ideaRef = doc(db, "ideas", idea.id);
      const viewedBy = idea.viewedBy || [];
      
      // If user is logged in, check if they already viewed it in the past (via array)
      const alreadyViewedInHistory = currentUser ? viewedBy.includes(currentUser.id) : false;

      if (!alreadyViewedInHistory) {
        // Increment views
        const updatePayload: any = {
          views: increment(1)
        };

        // If logged in, also record the user
        if (currentUser) {
          updatePayload.viewedBy = arrayUnion(currentUser.id);
        }

        await updateDoc(ideaRef, updatePayload);
        
        // Mark locally immediately to prevent double-firing
        markIdeaAsViewedLocally(idea.id);
        
        // Optimistic update for UI feel
        queryClient.setQueriesData({ queryKey: ["ideas"] }, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              ideas: page.ideas.map((i: any) => 
                i.id === idea.id ? { 
                  ...i, 
                  views: (i.views || 0) + 1, 
                  viewedBy: currentUser ? [...(i.viewedBy || []), currentUser.id] : (i.viewedBy || [])
                } : i
              )
            }))
          };
        });
      } else {
        // Even if they viewed in history, mark locally for this session to avoid re-checking
        markIdeaAsViewedLocally(idea.id);
      }
    } catch (err) {
      console.error("View idea error:", err);
    }
  };

  const handleStoryLike = async (storyId: string) => {
    if (!currentUser || !storyId) return;
    try {
      const storyRef = doc(db, "stories", storyId);
      const storySnap = await getDoc(storyRef);
      if (storySnap.exists()) {
        const data = storySnap.data();
        const likes = data.likes || [];
        if (likes.includes(currentUser.id)) {
          await updateDoc(storyRef, {
            likes: arrayRemove(currentUser.id)
          });
        } else {
          await updateDoc(storyRef, {
            likes: arrayUnion(currentUser.id)
          });
        }
        queryClient.invalidateQueries({ queryKey: ["stories"] });
      }
    } catch (err) {
      console.error("Story like error:", err);
    }
  };

  const handleUpdateIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setTitle(idea.title);
    setContent(idea.content);
    setCategory(idea.category);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingIdea(null);
    setTitle("");
    setContent("");
    setCategory("أخرى");
    setIsModalOpen(true);
  };

  const { mutateAsync: createIdea } = useCreateIdea();
  const { mutateAsync: updateIdea } = useUpdateIdea();

  const handleSubmit = async () => {
    if (!title || !content || !currentUser) return;

    try {
      const hashtags = parseHashtags(content);

      // Determine content type for visual filtering
      let determinedType: "text" | "video" | "image" | "link" = "text";
      const linkRegex = /(https?:\/\/[^\s]+)/i;
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/i;
      const imageRegex = /\.(jpeg|jpg|gif|png|webp)/i;

      if (linkRegex.test(content)) {
        if (youtubeRegex.test(content)) {
          determinedType = "video";
        } else if (imageRegex.test(content)) {
          determinedType = "image";
        } else {
          determinedType = "link";
        }
      }

      if (editingIdea) {
        if (editingIdea.authorId !== currentUser.id) return;
        await updateIdea({
          id: editingIdea.id,
          data: {
            title,
            category,
            content,
            hashtags,
            type: determinedType,
          }
        });
        showToast("تم تحديث الفكرة بنجاح", "success");
      } else {
        await createIdea({
          title,
          category,
          content,
          hashtags,
          type: determinedType,
        });
        showToast("تم إضافة الفكرة بنجاح", "success");
      }

      setIsModalOpen(false);
      setEditingIdea(null);
      setTitle("");
      setContent("");
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const { mutateAsync: likeIdea } = useLikeIdea();

  const handleLike = async (e: React.MouseEvent, idea: any) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast("يجب تسجيل الدخول للإعجاب", "info");
      return;
    }
    try {
       await likeIdea(idea.id);
    } catch {
       showToast("حدث خطأ", "error");
    }
  };

  return {
    expandedIdeas,
    playingVideoId,
    setPlayingVideoId,
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
    handleLike,
    handleDeleteIdea,
    handleDeleteComment,
    handleFollow,
    handleStoryView,
    handleViewIdea,
    handleStoryLike,
    toggleExpand,
    handleUpdateIdea,
    handleOpenCreateModal,
    handleSubmit,
    currentUser,
    users,
    follows,
    comments,
  };
};
