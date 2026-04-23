import React, { useState } from "react";
import { useData } from "../../contexts/DataContext";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { Icons } from "../../components/Icons";
import { useToast } from "../../contexts/ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";

export const AdminComments: React.FC = () => {
  const queryClient = useQueryClient();
  const { comments, hasMoreComments, loadingMoreComments, loadMoreComments } = useData();
  
  const loadMoreRef = useIntersectionObserver(() => {
    if (hasMoreComments && !loadingMoreComments) {
      loadMoreComments();
    }
  });
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const activeComments = comments
    .filter(
      (c) =>
        !c.deleted &&
        (c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.authorName.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;
    try {
      await deleteDoc(doc(db, "comments", id));
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      showToast("تم حذف التعليق", "success");
    } catch (e) {
      showToast("حدث خطأ أثناء الحذف", "error");
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-amiri gradient-text">
            إدارة التعليقات
          </h1>
          <p className="text-gray-400">مراجعة وحذف التعليقات المخالفة</p>
        </div>
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="بحث في التعليقات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-style pl-10 pr-4 py-2 rounded-xl w-full md:w-64"
          />
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div className="grid gap-4">
        {activeComments.map((comment) => (
          <div
            key={comment.id}
            className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start group"
          >
            <div className="flex gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                {comment.authorName[0]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-pink-400">
                    {comment.authorName}
                  </h4>
                  <span className="text-[10px] text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-gray-200 mt-1 text-sm leading-relaxed bg-white/5 p-3 rounded-lg rounded-tr-none">
                  {comment.text}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => handleDelete(comment.id)}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Icons.Trash className="w-4 h-4" /> حذف
              </button>
            </div>
          </div>
        ))}

        {activeComments.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
            <Icons.Message className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>لا توجد تعليقات</p>
          </div>
        )}
      </div>

      <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center mt-4">
        {loadingMoreComments && (
          <div className="flex items-center gap-2 text-accent">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold">جاري تحميل المزيد من التعليقات...</span>
          </div>
        )}
      </div>
    </div>
  );
};
