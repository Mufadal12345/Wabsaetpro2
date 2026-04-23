import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { Icons } from "../components/Icons";
import { User, Idea } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc, increment } from "firebase/firestore";
import { UserAvatar } from "../components/UserAvatar";
import { EditableAvatar } from "../components/EditableAvatar";
import { IdeaListItem } from "../components/IdeaListItem";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "./admin/Modal";

export const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const { users, ideas, follows, comments } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Post Actions States
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following" | "achievements">("posts");

  const profileUser = users.find((u) => u.id === userId);
  const isOwnProfile = currentUser?.id === userId;
  
  const userIdeas = useMemo(() => {
    return ideas
      .filter((i) => i.authorId === userId && !i.deleted)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [ideas, userId]);

  const pinnedCount = useMemo(() => userIdeas.filter((i: Idea) => i.isPinned).length, [userIdeas]);
  
  const followsYou = follows.some(f => f.followerId === userId && f.followingId === currentUser?.id);

  const userFollowers = follows
    .filter((f) => f.followingId === userId)
    .map((f) => users.find((u) => u.id === f.followerId))
    .filter(Boolean) as User[];

  const userFollowing = follows
    .filter((f) => f.followerId === userId)
    .map((f) => users.find((u) => u.id === f.followingId))
    .filter(Boolean) as User[];

  const handlePinIdea = async (idea: Idea) => {
    if (!currentUser || !isOwnProfile) return;
    
    try {
      if (!idea.isPinned && pinnedCount >= 3) {
        showToast("يمكنك تثبيت 3 منشورات فقط", "info");
        return;
      }

      const ideaRef = doc(db, "ideas", idea.id);
      await updateDoc(ideaRef, {
        isPinned: !idea.isPinned,
        pinnedAt: !idea.isPinned ? new Date().toISOString() : null
      });
      
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      showToast(idea.isPinned ? "تم إلغاء التثبيت" : "تم التثبيت في الأعلى", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "ideas");
    }
  };

  const handleDeleteIdea = async () => {
    if (!deletingIdeaId || !currentUser) return;
    
    const id = deletingIdeaId;
    setDeletingIdeaId(null);
    
    try {
      await deleteDoc(doc(db, "ideas", id));
      // تحديث جميع الاستعلامات المتعلقة بالأفكار
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      // تحديث واجهة المستخدم فوراً
      showToast("تم حذف المنشور بنجاح", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "ideas");
      showToast("فشل الحذف", "error");
    }
  };

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

  const handleLike = async (e: React.MouseEvent, idea: Idea) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast("يرجى تسجيل الدخول للإعجاب", "info");
      return;
    }

    try {
      const likeQuery = query(
        collection(db, "likes"),
        where("ideaId", "==", idea.id),
        where("userId", "==", currentUser.id),
      );
      const likeSnapshot = await getDocs(likeQuery);

      if (!likeSnapshot.empty) {
        await deleteDoc(doc(db, "likes", likeSnapshot.docs[0].id));
        await updateDoc(doc(db, "ideas", idea.id), {
          likes: increment(-1),
        });
      } else {
        await addDoc(collection(db, "likes"), {
          ideaId: idea.id,
          userId: currentUser.id,
          createdAt: new Date().toISOString(),
        });
        await updateDoc(doc(db, "ideas", idea.id), {
          likes: increment(1),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  useEffect(() => {
    if (profileUser) {
      setName(profileUser.name || "");
      setBio(profileUser.bio || "");
      setSpecialty(profileUser.specialty || "");
    }
  }, [profileUser]);

  useEffect(() => {
    if (currentUser && userId && !isOwnProfile) {
      const follow = follows.find(f => f.followerId === currentUser.id && f.followingId === userId);
      setIsFollowing(!!follow);
    }
  }, [currentUser, userId, follows, isOwnProfile]);

  const handleUpdateProfile = async () => {
    if (!currentUser || !isOwnProfile || !currentUser.id) {
        showToast("خطأ في بيانات المستخدم", "error");
        return;
    }
    setIsLoading(true);
    
    // Close modal/editing immediately
    setIsEditing(false);

    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        name,
        bio,
        specialty,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("تم تحديث الملف الشخصي", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.id}`);
      showToast("فشل تحديث الملف الشخصي", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !userId || isOwnProfile) return;
    
    // Optimistic UI update
    const originalState = isFollowing;
    setIsFollowing(!originalState);
    setIsLoading(true);

    try {
      if (originalState) {
        // Unfollow
        const followQuery = query(
          collection(db, "follows"),
          where("followerId", "==", currentUser.id),
          where("followingId", "==", userId)
        );
        const snapshot = await getDocs(followQuery);
        for (const d of snapshot.docs) {
          await deleteDoc(doc(db, "follows", d.id));
        }

        // Update counts
        await updateDoc(doc(db, "users", userId), {
          followersCount: increment(-1)
        });
        await updateDoc(doc(db, "users", currentUser.id), {
          followingCount: increment(-1)
        });
      } else {
        // Follow
        await addDoc(collection(db, "follows"), {
          followerId: currentUser.id,
          followingId: userId,
          createdAt: new Date().toISOString()
        });

        // Update counts
        await updateDoc(doc(db, "users", userId), {
          followersCount: increment(1)
        });
        await updateDoc(doc(db, "users", currentUser.id), {
          followingCount: increment(1)
        });
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["follows"] }); 
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "follows/users");
      showToast("حدث خطأ، حاول مجدداً", "error");
      // Revert on error
      setIsFollowing(originalState);
    } finally {
      setIsLoading(false);
    }
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in font-tajawal">
      {/* Header Card */}
      <div className="glass-card rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 mt-12">
          {/* UserAvatar replaced by EditableAvatar */}
          <div className="md:mb-[-40px] z-10 rounded-full shadow-2xl ring-4 ring-[#0a0f1f]">
            <EditableAvatar user={profileUser} isEditable={isOwnProfile} />
          </div>

          <div className="flex-1 text-center md:text-right mt-12 md:mt-0">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{profileUser.name}</h1>
              {followsYou && (
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 border border-white/10">يتابعك</span>
              )}
            </div>
            <p className="text-accent font-medium mb-4">{profileUser.specialty || "مفكر في متحف الفكر"}</p>
            
            <div className="flex items-center justify-center md:justify-start gap-6 text-sm text-gray-400">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-white font-bold text-lg">{profileUser.followersCount || 0}</span>
                <span>متابع</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-white font-bold text-lg">{profileUser.followingCount || 0}</span>
                <span>يتابع</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-white font-bold text-lg">{userIdeas.length}</span>
                <span>منشور</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="btn-primary px-6 py-2 rounded-full flex items-center gap-2"
              >
                <Icons.Settings className="w-4 h-4" />
                تعديل الملف
              </button>
            ) : (
              <button 
                onClick={handleFollow}
                disabled={isLoading}
                className={`px-8 py-2 rounded-full font-bold transition-all ${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-accent text-white shadow-lg shadow-pink-500/30'}`}
              >
                {isLoading ? 'جاري...' : isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
              </button>
            )}
          </div>
        </div>

        {profileUser.bio && (
          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5">
            <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest">نبذة شخصية</h3>
            <p className="text-gray-300 leading-relaxed">{profileUser.bio}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-4 text-lg font-bold transition-all relative ${activeTab === "posts" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          المنشورات
          {activeTab === "posts" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          className={`pb-4 text-lg font-bold transition-all relative ${activeTab === "followers" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          المتابعون ({userFollowers.length})
          {activeTab === "followers" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`pb-4 text-lg font-bold transition-all relative ${activeTab === "following" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          يتابع ({userFollowing.length})
          {activeTab === "following" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={`pb-4 text-lg font-bold transition-all relative ${activeTab === "achievements" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          الإنجازات
          {activeTab === "achievements" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"></div>}
        </button>
      </div>

      {activeTab === "posts" && (
        <div className="space-y-6">
          {userIdeas.map((idea: Idea) => (
            <div key={idea.id} className="relative">
              {/* زر الحذف المباشر (يظهر فقط للمالك) */}
              {isOwnProfile && (
                <button
                  onClick={() => {
                    if (window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) {
                      setDeletingIdeaId(idea.id);
                    }
                  }}
                  className="absolute top-4 left-4 z-10 p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white shadow-lg transition-all"
                  title="حذف المنشور"
                >
                  <Icons.Trash className="w-4 h-4" />
                </button>
              )}
              
              <IdeaListItem 
                key={idea.id}
                idea={idea}
                currentUser={currentUser}
                users={users}
                follows={follows}
                comments={comments}
                handleFollow={handleFollow}
                handleSelectIdea={(id) => navigate(`/ideas?ideaId=${id}`)}
                setDeletingIdeaId={setDeletingIdeaId}
                handleUpdateIdea={(i) => setEditingIdea(i)}
                handlePinIdea={handlePinIdea}
                playingVideoId={playingVideoId}
                setPlayingVideoId={setPlayingVideoId}
                handleLike={handleLike}
                isOwnProfile={isOwnProfile}
              />
            </div>
          ))}

          {userIdeas.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500">لا توجد منشورات بعد</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "followers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userFollowers.map(user => (
            <div 
              key={user.id}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer border border-white/5"
            >
              <UserAvatar user={user} className="w-12 h-12" />
              <div className="flex-1">
                <h4 className="font-bold text-white">{user.name}</h4>
                <p className="text-xs text-gray-500">{user.specialty || "مفكر"}</p>
              </div>
              <Icons.Plus className="w-5 h-5 text-gray-600" />
            </div>
          ))}
          {userFollowers.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500">لا يوجد متابعون بعد</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "following" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userFollowing.map(user => (
            <div 
              key={user.id}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer border border-white/5"
            >
              <UserAvatar user={user} className="w-12 h-12" />
              <div className="flex-1">
                <h4 className="font-bold text-white">{user.name}</h4>
                <p className="text-xs text-gray-500">{user.specialty || "مفكر"}</p>
              </div>
              <Icons.Plus className="w-5 h-5 text-accent rotate-45" />
            </div>
          ))}
          {userFollowing.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500">لا يتابع أحداً بعد</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-white/10 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full p-1 shadow-lg shadow-orange-500/50 mb-4">
              <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center">
                <Icons.Star className="w-10 h-10 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">سجل التقدم والإنجازات</h3>
            <p className="text-gray-400">تابع مستواك وتطورك في متحف الفكر بناءً على مساهماتك.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* We will calculate current level dynamically here for display */}
            {[
              { level: 1, title: "مستكشف مبتدئ", req: 0 },
              { level: 2, title: "مفكر واعد", req: 1 },
              { level: 3, title: "كاتب مبدع", req: 5 },
              { level: 4, title: "فيلسوف المتحف", req: 10 },
              { level: 5, title: "حكيم العصر", req: 25 },
            ].map((lvl) => {
              const isUnlocked = userIdeas.length >= lvl.req;
              return (
                <div key={lvl.level} className={`p-6 rounded-2xl border transition-all ${isUnlocked ? 'bg-white/10 border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'bg-white/5 border-white/5 opacity-50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-500'}`}>
                        {isUnlocked ? <Icons.Check className="w-5 h-5" /> : <Icons.Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">المستوى {lvl.level}: {lvl.title}</h4>
                        <p className="text-xs text-gray-400">يتطلب {lvl.req} منشورات</p>
                      </div>
                    </div>
                  </div>
                  {isUnlocked && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        <Icons.Unlock className="w-4 h-4" /> تم الفتح بنجاح
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Action Modals */}
      <Modal
        isOpen={!!deletingIdeaId}
        onClose={() => setDeletingIdeaId(null)}
        title="تأكيد الحذف"
      >
        <div className="p-4 text-center">
          <p className="text-white mb-6">هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setDeletingIdeaId(null)}
              className="px-6 py-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleDeleteIdea}
              className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/20"
            >
              حذف نهائي
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingIdea}
        onClose={() => setEditingIdea(null)}
        title="تعديل المنشور"
      >
        <form onSubmit={handleUpdateIdeaSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-500 text-sm mb-2 font-bold">العنوان</label>
            <input
              value={editingIdea?.title || ""}
              onChange={(e) => setEditingIdea(prev => prev ? {...prev, title: e.target.value} : null)}
              className="input-style w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-gray-500 text-sm mb-2 font-bold">المحتوى</label>
            <textarea
              value={editingIdea?.content || ""}
              onChange={(e) => setEditingIdea(prev => prev ? {...prev, content: e.target.value} : null)}
              className="input-style w-full px-4 py-3 rounded-xl h-48 resize-none border border-white/10 bg-white/5 text-white leading-relaxed"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full py-4 rounded-2xl font-bold text-xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            حفظ التغييرات
          </button>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        title="تعديل الملف الشخصي"
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-500 text-xs font-bold mb-2">الاسم</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-style w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-500 text-xs font-bold mb-2">التخصص</label>
              <input 
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="input-style w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-500 text-xs font-bold mb-2">النبذة الشخصية</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-style w-full px-4 py-3 rounded-xl h-40 resize-none border border-white/10 bg-white/5 text-white leading-relaxed"
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsEditing(false)} 
              className="flex-1 py-3 text-gray-400 hover:text-white transition font-bold"
            >
              إلغاء
            </button>
            <button 
              onClick={handleUpdateProfile} 
              disabled={isLoading} 
              className="btn-primary flex-[2] py-3 rounded-2xl font-bold shadow-lg shadow-accent/20"
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
