import React, { useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { STATIC_CONTENT } from "../data/staticData";
import { Icons } from "../components/Icons";
import { CardSkeleton } from "../components/Skeletons";
import { Modal } from "./admin/Modal";
import { ConfirmModal } from "../components/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { parseHashtags } from "../utils";

import { useQueryClient } from "@tanstack/react-query";

export const Philosophy: React.FC = () => {
  const { ideas, now, loadingData } = useData();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const philosophyIdeas = useMemo(() => {
    const dbIdeaIds = new Set(ideas.map((i) => i.id));
    const activeStatic = STATIC_CONTENT.filter((s) => !dbIdeaIds.has(s.id));
    const allContent = [...ideas, ...activeStatic];
    return allContent.filter(
      (i) =>
        !i.deleted &&
        i.category === "فلسفة" &&
        (!i.showAfter || new Date(i.showAfter).getTime() <= now.getTime()),
    );
  }, [ideas, now]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    try {
      await deleteDoc(doc(db, "ideas", id));
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      showToast("تم حذف المنشور بنجاح", "success");
    } catch (err) {
      console.error("Delete philosophy post error:", err);
      showToast("حدث خطأ أثناء الحذف", "error");
    }
  };

  const handleSubmit = async () => {
    if (!title || !content || !currentUser) return;
    
    // Close modal immediately
    setIsModalOpen(false);
    setTitle("");
    setContent("");

    try {
      const hashtags = parseHashtags(content);
      await addDoc(collection(db, "ideas"), {
        title,
        category: "فلسفة",
        content,
        hashtags,
        author: currentUser.name,
        authorId: currentUser.id,
        authorRole: currentUser.role,
        views: 0,
        viewedBy: [],
        likes: 0,
        likedBy: [],
        featured: false,
        deleted: false,
        createdAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      showToast("تم إضافة المنشور الفلسفي بنجاح", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "ideas");
      showToast("حدث خطأ أثناء النشر", "error");
    }
  };

  return (
    <div className="h-full flex flex-col relative animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
      </div>

      <div className="relative rounded-2xl overflow-hidden mb-8 mx-2 md:mx-6 mt-2 h-64 border border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-indigo-950"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center z-10 px-4">
            <i className="fas fa-brain text-5xl text-yellow-400 mb-4 animate-pulse"></i>
            <h1 className="text-4xl md:text-5xl font-bold font-amiri mb-2 text-white neon-text">
              رواق الفلسفة
            </h1>
            <p className="text-gray-300 font-amiri text-lg opacity-80 mb-6">
              "الحكمة هي ضالة المؤمن، أنى وجدها فهو أحق بها"
            </p>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-xl shadow-yellow-500/20 flex items-center gap-2 mx-auto"
            >
              <Icons.Plus className="w-5 h-5" />
              إضافة منشور فلسفي
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-0 custom-scrollbar">
        <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto pb-20">
          {loadingData && philosophyIdeas.length === 0 ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            philosophyIdeas.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate("/ideas")}
                className="glass p-6 rounded-2xl cursor-pointer card-hover border-r-4 border-l-0 border-yellow-500 relative overflow-hidden group"
              >
              <div className="absolute -right-10 -top-10 text-9xl text-white/5 group-hover:text-white/10 transition-colors rotate-12">
                <i className="fas fa-quote-right"></i>
              </div>

              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <div>
                  <h3 className="font-bold text-white">{item.author}</h3>
                  <p className="text-xs text-gray-400">فيلسوف / مفكر</p>
                </div>
              </div>

              <h2 className="text-xl md:text-2xl font-bold font-amiri mb-3 text-white group-hover:text-yellow-400 transition-colors relative z-10">
                {item.title}
              </h2>
              <p className="text-gray-300 leading-loose text-base md:text-lg font-amiri pl-4 border-l border-white/10 relative z-10 line-clamp-4">
                {item.content}
              </p>

              <div className="mt-4 flex justify-between items-center relative z-10">
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2 hover:text-red-400 transition">
                    <i className="far fa-heart"></i> {item.likes}
                  </span>
                  <span className="flex items-center gap-2 hover:text-blue-400 transition">
                    <i className="far fa-share-square"></i> مشاركة
                  </span>
                </div>
                {(currentUser?.role === "admin" || currentUser?.id === item.authorId) && !item.id.startsWith("static") && (
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {!loadingData && philosophyIdeas.length === 0 && (
        <div className="text-center py-20 text-gray-500 glass-card rounded-2xl border border-white/5 mx-auto max-w-4xl mt-10">
          لا توجد أفكار فلسفية حالياً
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="✨ إضافة منشور فلسفي جديد"
      >
        <div className="space-y-6 font-tajawal pb-10">
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500 p-[3px] shadow-lg shadow-yellow-500/20">
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
                    <Icons.Globe className="w-3 h-3" /> رواق الفلسفة
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="عنوان الخاطرة الفلسفية..."
                className="input-style w-full px-4 py-4 rounded-2xl font-bold text-2xl border-none bg-transparent focus:ring-0 placeholder:text-gray-700 text-white"
              />
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4" />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ما هي الحكمة التي تود مشاركتها اليوم؟"
                className="input-style w-full px-4 py-4 rounded-2xl h-72 resize-none leading-relaxed border-none bg-transparent focus:ring-0 placeholder:text-gray-700 text-xl text-gray-200"
              ></textarea>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="btn-primary w-full py-4 rounded-2xl font-bold text-xl shadow-2xl shadow-yellow-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-600 text-black border-none group"
          >
            <span>نشر في الرواق</span>
            <Icons.Share className="w-6 h-6 group-hover:translate-x-[-4px] transition-transform" />
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        message="هل أنت متأكد من حذف هذا المنشور الفلسفي؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
      />
    </div>
  );
};
