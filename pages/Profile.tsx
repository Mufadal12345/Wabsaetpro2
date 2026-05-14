import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { Icons } from "../components/Icons";
import { Eye, Heart } from "lucide-react";
import { Idea } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "./admin/Modal";
import { SettingsMenu } from "../components/SettingsMenu";
import { ConfirmModal } from "../components/ConfirmModal";
import { MediaRouter } from "../components/MediaRouter";
import { EditableAvatar } from "../components/EditableAvatar";
import { UserAvatar } from "../components/UserAvatar";
import { useFeedActions } from "../hooks/useFeedActions";
import { Virtuoso } from "react-virtuoso";
// ... (rest is unmodified above line 19)
import { useSocialRelation, useMultipleUsers } from "../hooks/useAppQueries";

export const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentUser, updateCurrentUser } = useAuth();
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const userId = paramUserId || currentUser?.id;
  const navigate = useNavigate();
  const { users, ideas, comments, follows, currentUserFollowing } = useData();
  const { showToast } = useToast();

  const {
      expandedIdeas, 
      playingVideoId, 
      setPlayingVideoId, 
      toggleExpand, 
      handleLike,
      handleFollow: handleFollowAction,
      handleDeleteComment,
      handleDeleteIdea: deleteIdeaAction,
      handleViewIdea,
  } = useFeedActions();

  // Social Data
  const { data: socialRelation } = useSocialRelation(userId || "");
  const [socialModalType, setSocialModalType] = useState<"followers" | "following" | null>(null);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  
  const socialUserIds = useMemo(() => {
    if (!socialRelation || !socialModalType) return [];
    return socialModalType === "followers" ? socialRelation.followers : socialRelation.following;
  }, [socialRelation, socialModalType]);

  const { data: modalUsers, isLoading: isLoadingModalUsers } = useMultipleUsers(socialUserIds);
  const location = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(location.pathname === "/settings");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  
  // Post Actions States
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [deletingIdea, setDeletingIdea] = useState<{id: string, authorId: string} | null>(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"posts" | "visuals">("posts");
  
  const isOwnProfile = currentUser?.id === userId;
  const profileUser = users.find((u) => u.id === userId) || (isOwnProfile ? currentUser : null);

  const userIdeas = useMemo(() => {
    return ideas
      .filter((i) => i.authorId === userId && !i.deleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ideas, userId]);

  const totalViews = useMemo(() => {
    return userIdeas.reduce((sum, idea) => sum + (idea.views || 0), 0);
  }, [userIdeas]);

  const userTextIdeas = useMemo(() => {
    const regex = /(https?:\/\/[^\s]+)/i;
    return userIdeas.filter(i => !regex.test(i.content || ""));
  }, [userIdeas]);

  const userVisualIdeas = useMemo(() => {
    const regex = /(https?:\/\/[^\s]+)/i;
    return userIdeas.filter(i => regex.test(i.content || ""));
  }, [userIdeas]);

  const handleUpdateIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea || !currentUser) return;
    try {
      await updateDoc(doc(db, "ideas", editingIdea.id), {
        title: editingIdea.title,
        content: editingIdea.content,
        category: editingIdea.category,
        updatedAt: new Date().toISOString()
      });
      setEditingIdea(null);
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      showToast("تم تحديث المنشور", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "ideas");
      showToast("فشل التحديث", "error");
    }
  };

  const confirmDeleteIdea = async () => {
    if (!deletingIdea) return;
    try {
      await deleteIdeaAction(deletingIdea.id, deletingIdea.authorId);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeletingIdea(null);
    }
  };

  const isFollowing = useMemo(() => {
    if (!currentUser || !userId) return false;
    return currentUserFollowing?.includes(userId);
  }, [currentUserFollowing, userId, currentUser]);

  useEffect(() => {
    if (profileUser) {
      setName(profileUser.name || "");
      setBio(profileUser.bio || "");
      setSpecialty(profileUser.specialty || "");
    }
  }, [profileUser]);

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener("openSettings", handleOpenSettings);
    return () => window.removeEventListener("openSettings", handleOpenSettings);
  }, []);

  const handleUpdateProfile = async () => {
    if (!currentUser || !isOwnProfile) return;
    
    // Close modal immediately and don't block UI
    setIsEditing(false);
    
    // Optimistic UI Update
    updateCurrentUser({ name, bio, specialty });
    
    // Optionally also update the users array in queryClient if needed
    queryClient.setQueryData(["currentUser"], (old: any) => ({ ...old, name, bio, specialty }));
    queryClient.setQueriesData({ queryKey: ["users"] }, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            users: page.users.map((u: any) => u.id === currentUser.id ? { ...u, name, bio, specialty } : u)
          }))
        };
    });

    try {
      await updateDoc(doc(db, "users", currentUser.id), { name, bio, specialty });
      // Invalidate to ensure consistency, but it happens in background
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("تم تحديث الملف الشخصي", "success");
    } catch (error) {
           // Revert might be needed if this fails, but for simplicity we just show error.
           // A real app might save the old state and revert.
      handleFirestoreError(error, OperationType.UPDATE, `users`);
      showToast("فشل التحديث", "error");
    }
  };

  const wrapHandleFollow = (e: React.MouseEvent) => {
    if (!userId) return;
    handleFollowAction(e, userId);
  };

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Icons.User className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-xl">المستخدم غير موجود</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen pb-24 text-right font-tajawal animate-fade-in" dir="rtl">
      {/* الهيدر الأنيق (ستايل انستغرام) */}
      <div className="pt-8 pb-6 border-b border-zinc-900/50 bg-zinc-900/20 px-4 md:px-0 relative">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="shrink-0 flex items-center justify-center">
              <EditableAvatar user={profileUser} isEditable={isOwnProfile} className="w-16 h-16" />
            </div>
            
            <div className="flex-1 flex gap-2 sm:gap-6 text-center text-sm md:text-base justify-around items-center">
                <div className="flex flex-col">
                    <span className="font-bold text-lg md:text-xl text-white block">{userIdeas.length}</span>
                    <span className="text-zinc-400 text-xs text-center w-full block">منشورات</span>
                </div>
                <button onClick={() => setSocialModalType("followers")} className="flex flex-col hover:opacity-80 transition-opacity">
                    <span className="font-bold text-lg md:text-xl text-white block">{socialRelation?.followers.length || 0}</span>
                    <span className="text-zinc-400 text-xs text-center w-full block">متابعون</span>
                </button>
                <button onClick={() => setSocialModalType("following")} className="flex flex-col hover:opacity-80 transition-opacity">
                    <span className="font-bold text-lg md:text-xl text-white block">{socialRelation?.following.length || 0}</span>
                    <span className="text-zinc-400 text-xs text-center w-full block">يتابع</span>
                </button>
            </div>
          </div>
          
          <div className="mt-4 px-1">
            <h2 className="text-base md:text-lg font-bold text-white">{profileUser.name}</h2>
            <div className="text-accent text-xs mb-2 mt-0.5">{profileUser.specialty || "مفكر"}</div>
            {profileUser.bio && <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{profileUser.bio}</div>}
            
            {(isOwnProfile || currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
            <button 
              onClick={() => setStatsModalOpen(true)}
              className="mt-3 bg-gradient-to-r from-zinc-900 to-black border border-white/5 hover:border-amber-500/40 transition-all duration-500 shadow-inner px-4 py-1.5 rounded-full text-[11px] text-zinc-400 flex items-center w-fit group"
            >
              <Icons.TrendingUp className="w-3.5 h-3.5 mr-2 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>الإحصائيات</span>
              <span className="mx-2 opacity-30">|</span>
              <span>المشاهدات:</span>
              <span className="text-amber-500 font-bold mr-2 text-xs">{totalViews}</span>
            </button>
            )}
          </div>

          <div className="mt-5 flex gap-3 px-1">
              {isOwnProfile ? (
                   <button onClick={() => setIsEditing(!isEditing)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-1.5 md:py-2 rounded-xl text-sm font-bold transition">
                    تعديل الملف الشخصي
                  </button>
              ) : (
                  <button onClick={wrapHandleFollow} className={`flex-1 py-1.5 md:py-2 rounded-xl text-sm font-bold transition ${isFollowing ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-accent text-black hover:opacity-90'}`}>
                    {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                  </button>
              )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/5 mx-auto max-w-xl mt-6">
        <button onClick={() => setActiveTab("posts")} className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${activeTab === "posts" ? "text-accent border-b-2 border-accent bg-white/5" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.02]"}`}>
            <span className="font-bold text-sm tracking-widest uppercase">أفكار</span>
            <span className="text-[10px] font-black">{userTextIdeas.length}</span>
        </button>
        <button onClick={() => setActiveTab("visuals")} className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${activeTab === "visuals" ? "text-accent border-b-2 border-accent bg-white/5" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.02]"}`}>
            <span className="font-bold text-sm tracking-widest uppercase">المرئي</span>
            <span className="text-[10px] font-black">{userVisualIdeas.length}</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-1 sm:px-2 mt-6 mb-20 space-y-3">
        {activeTab === "posts" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                {userTextIdeas.map((post: Idea) => (
                    <MediaRouter key={post.id} idea={post} context="profile" handleSelectIdea={() => setViewingPostId(post.id)} currentUser={currentUser} />
                ))}
            </div>
        )}

        {activeTab === "visuals" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                {userVisualIdeas.map((post: Idea) => (
                    <MediaRouter key={post.id} idea={post} context="profile" handleSelectIdea={() => setViewingPostId(post.id)} currentUser={currentUser} />
                ))}
            </div>
        )}
      </div>

      {viewingPostId && (
        <div className="fixed inset-0 z-50 bg-[#000000] overflow-hidden flex flex-col">
          <div className="sticky top-0 z-10 flex items-center p-4 bg-black/80 backdrop-blur-md border-b border-white/10">
            <button onClick={() => setViewingPostId(null)} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition">
              <Icons.ArrowRight className="w-6 h-6 text-white" />
            </button>
            <span className="font-bold text-white ml-2 text-lg tracking-wide uppercase">المنشورات</span>
          </div>

          <div className="flex-1 overflow-hidden" dir="rtl">
             <Virtuoso
                style={{ height: "100%", width: "100%" }}
                data={activeTab === "posts" ? userTextIdeas : userVisualIdeas}
                initialTopMostItemIndex={Math.max(0, (activeTab === "posts" ? userTextIdeas : userVisualIdeas).findIndex(i => i.id === viewingPostId))}
                itemContent={(_, idea) => (
                  <div className="pb-6 pt-2 px-1 md:px-0 max-w-2xl mx-auto">
                    <MediaRouter 
                      context="feed"
                      idea={idea}
                      currentUser={currentUser}
                      users={users}
                      follows={follows}
                      comments={comments}
                      expandedIdeas={expandedIdeas}
                      toggleExpand={toggleExpand}
                      handleFollow={handleFollowAction}
                      handleViewIdea={handleViewIdea}
                      handleSelectIdea={(id) => navigate(`/ideas?ideaId=${id}`)}
                      handleDeleteIdea={(id, authorId) => {
                        if (id && authorId) {
                          setDeletingIdea({ id, authorId });
                        }
                      }}
                      handleDeleteComment={handleDeleteComment}
                      handleUpdateIdea={setEditingIdea}
                      playingVideoId={playingVideoId}
                      setPlayingVideoId={setPlayingVideoId}
                      handleLike={handleLike}
                      isOwnProfile={isOwnProfile || false}
                    />
                  </div>
                )}
             />
          </div>
        </div>
      )}

      <Modal isOpen={statsModalOpen} onClose={() => setStatsModalOpen(false)} title="إحصائيات المنشورات">
        <div className="p-4 max-h-[60vh] overflow-y-auto">
            {userIdeas.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">لا توجد منشورات لعرض إحصائياتها</div>
            ) : (
                <div className="space-y-3">
                    {userIdeas.map(post => (
                        <div key={post.id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                            <div className="flex-1 truncate pl-4">
                                <h4 className="text-sm font-bold text-white truncate">{post.title || post.content.substring(0, 30) + '...'}</h4>
                                <span className="text-xs text-zinc-500">{new Date(post.createdAt).toLocaleDateString('ar-EU')}</span>
                            </div>
                            <div className="flex gap-4 text-xs font-bold shrink-0">
                                <span className="flex items-center gap-1 text-accent"><Eye size={14}/> {post.views || 0}</span>
                                <span className="flex items-center gap-1 text-pink-500"><Heart size={14}/> {post.likes || 0}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </Modal>

      <Modal isOpen={!!editingIdea} onClose={() => setEditingIdea(null)} title="تعديل المنشور">
        <form onSubmit={handleUpdateIdeaSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-xs mb-2 font-bold uppercase tracking-wider">العنوان</label>
            <input value={editingIdea?.title || ""} onChange={(e) => setEditingIdea(prev => prev ? {...prev, title: e.target.value} : null)} className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-black text-white focus:ring-2 focus:ring-accent outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-2 font-bold uppercase tracking-wider">المحتوى</label>
            <textarea value={editingIdea?.content || ""} onChange={(e) => setEditingIdea(prev => prev ? {...prev, content: e.target.value} : null)} className="w-full px-5 py-4 rounded-2xl h-48 resize-none border border-white/10 bg-black text-white leading-relaxed focus:ring-2 focus:ring-accent outline-none transition-all" required />
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={() => {
                if (editingIdea) {
                  setDeletingIdea({ id: editingIdea.id, authorId: editingIdea.authorId });
                  setEditingIdea(null);
                }
              }}
              className="flex-1 py-4 rounded-2xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
              حذف الفكرة
            </button>
            <button type="submit" className="flex-1 py-4 rounded-2xl font-bold bg-accent text-black hover:opacity-90 transition-all shadow-lg shadow-accent/20">حفظ التغييرات</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!socialModalType} onClose={() => setSocialModalType(null)} title={socialModalType === "followers" ? "المتابِعون" : "يتابع"}>
        <div className="p-4 max-h-[60vh] overflow-y-auto min-h-[200px]">
          {isLoadingModalUsers ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-white/5 rounded-full" />
                  <div className="flex-1 h-4 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : modalUsers && modalUsers.length > 0 ? (
            <div className="space-y-4">
              {modalUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <button 
                    onClick={() => {
                      setSocialModalType(null);
                      navigate(`/profile/${user.id}`);
                    }}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <UserAvatar user={{ id: user.id || '', name: user.name || 'U', photoURL: user.photoURL }} className="w-10 h-10" />
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{user.name}</div>
                      <div className="text-[10px] text-zinc-500">{user.specialty || "مفكر"}</div>
                    </div>
                  </button>
                  
                  {currentUser?.id !== user.id && (
                    <button 
                      onClick={(e) => handleFollowAction(e, user.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        currentUserFollowing?.includes(user.id) 
                        ? 'bg-zinc-800 text-white' 
                        : 'bg-accent text-black'
                      }`}
                    >
                      {currentUserFollowing?.includes(user.id) ? 'إلغاء' : 'متابعة'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
              <Icons.User className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">لا يوجد أحد هنا بعد</p>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={!!deletingIdea} 
        onClose={() => setDeletingIdea(null)}
        onConfirm={confirmDeleteIdea}
        title="حذف المنشور"
        message="هل أنت متأكد من رغبتك في حذف هذا المنشور بشكل نهائي؟ لا يمكن التراجع عن هذه الخطوة."
        confirmText="نعم، احذف المنشور"
      />

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="تعديل الملف الشخصي">
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">الاسم</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black text-white outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">التخصص</label>
            <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black text-white outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">النبذة الشخصية</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-4 py-3 rounded-xl h-32 resize-none border border-white/10 bg-black text-white leading-relaxed outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <button onClick={handleUpdateProfile} className="w-full py-3 bg-accent text-black rounded-xl font-bold hover:opacity-90 transition-opacity">
            حفظ التغييرات
          </button>
        </div>
      </Modal>

      <SettingsMenu isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};
