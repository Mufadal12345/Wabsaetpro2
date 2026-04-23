import React, { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { Course } from "../types";
import { Modal } from "./admin/Modal";
import { ConfirmModal } from "../components/ConfirmModal";
import { extractYoutubeId, getYoutubeThumbnail } from "../utils";
import { Icons } from "../components/Icons";
import { SmartContentPreviewEngine } from "../components/SmartContentPreviewEngine";
import { CardSkeleton } from "../components/Skeletons";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useQueryClient } from "@tanstack/react-query";

import { Browser } from '@capacitor/browser';

export const Skills: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, bookmarks, loadingData } = useData();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  // Form
  const [title, setTitle] = useState("");
  const [type, setType] = useState("قناة يوتيوب");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const allCourses = useMemo(() => {
    return courses;
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let sorted = [...allCourses].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (filter !== "all") {
      sorted = sorted.filter((c) => c.type === filter);
    }
    return sorted;
  }, [allCourses, filter]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id.startsWith("static")) return;
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    try {
      await deleteDoc(doc(db, "courses", id));
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      showToast("تم حذف المصدر بنجاح", "success");
    } catch (error) {
      console.error("Delete course error:", error);
      showToast("حدث خطأ أثناء الحذف", "error");
    }
  };

  const handleSubmit = async () => {
    if (!title || !desc) return;
    if (!currentUser?.id) {
      showToast("خطأ في تسجيل الدخول", "error");
      return;
    }
    
    // Close modal immediately
    setIsModalOpen(false);
    setTitle("");
    setDesc("");
    setLink("");

    try {
      await addDoc(collection(db, "courses"), {
        title,
        type,
        description: desc,
        link,
        addedBy: currentUser.name,
        addedById: currentUser.id,
        addedByRole: currentUser.role,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        views: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      showToast("تمت الإضافة بنجاح", "success");
    } catch (error) {
      console.error("Add course error:", error);
      showToast("حدث خطأ أثناء الإضافة", "error");
    }
  };

  const handleLike = async (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    if (course.id.startsWith("static")) return showToast("محتوى ثابت", "info");
    if (!currentUser) return;

    const ref = doc(db, "courses", course.id);
    const likedBy = course.likedBy || [];
    const isLiked = likedBy.includes(currentUser.id);

    await updateDoc(ref, {
      likes: Math.max(0, (course.likes || 0) + (isLiked ? -1 : 1)),
      likedBy: isLiked
        ? likedBy.filter((id) => id !== currentUser.id)
        : [...likedBy, currentUser.id],
    });
  };

  const handleBookmark = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    const existing = bookmarks.find((b) => b.courseId === courseId);
    if (existing) {
      await deleteDoc(doc(db, "bookmarks", existing.id));
    } else {
      await addDoc(collection(db, "bookmarks"), {
        userId: currentUser.id,
        courseId,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "قناة يوتيوب":
        return "fa-youtube text-red-500";
      case "كورس أونلاين":
        return "fa-graduation-cap text-pink-500";
      case "كتب":
        return "fa-book text-yellow-500";
      case "بودكاست":
        return "fa-microphone text-green-500";
      case "مقالات":
        return "fa-newspaper text-blue-400";
      default:
        return "fa-laptop text-gray-400";
    }
  };

  const filters = [
    { key: "all", label: "الكل", icon: "fa-layer-group" },
    { key: "قناة يوتيوب", label: "يوتيوب", icon: "fa-youtube text-red-500" },
    {
      key: "كورس أونلاين",
      label: "كورسات",
      icon: "fa-graduation-cap text-pink-500",
    },
    { key: "كتب", label: "كتب", icon: "fa-book text-yellow-500" },
    { key: "بودكاست", label: "بودكاست", icon: "fa-microphone text-green-500" },
    { key: "مقالات", label: "مقالات", icon: "fa-newspaper text-blue-400" },
  ];

  return (
    <div className="h-full flex flex-col relative animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <header className="pb-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white neon-text font-tajawal">
            تطوير المهارات
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-pink-500/30 transition transform active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> إضافة مصدر
          </button>
        </div>

        <nav className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-6 py-2 rounded-full flex items-center gap-2 whitespace-nowrap transition ${filter === f.key ? "active-tab font-bold" : "glass hover:bg-white/10"}`}
            >
              <i
                className={`fas ${f.icon} ${filter === f.key ? "text-white" : ""}`}
              ></i>
              {f.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto pt-0 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {loadingData && filteredCourses.length === 0 ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            filteredCourses.map((course) => {
              const isBookmarked = bookmarks.some(
                (b) => b.courseId === course.id,
              );
              const isLiked =
                currentUser && course.likedBy?.includes(currentUser.id);

            return (
              <div
                key={course.id}
                className="glass rounded-2xl p-3 card-hover group relative flex flex-col"
              >
                <div className="relative mb-3 rounded-xl overflow-hidden h-44 bg-gray-800 flex items-center justify-center">
                  {/* Smart Content Preview Engine */}
                  {(() => {
                    const ytId = extractYoutubeId(course.link);
                    if (ytId) {
                      return (
                        <SmartContentPreviewEngine 
                          url={course.link} 
                          title={course.title} 
                          thumbnail={getYoutubeThumbnail(ytId)} 
                        />
                      );
                    }
                    
                    if (course.preview?.image) {
                      return (
                        <img
                          src={course.preview.image}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        />
                      );
                    }

                    return (
                      <div
                        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900`}
                      >
                        <i
                          className={`fas ${getTypeIcon(course.type)} text-4xl`}
                        ></i>
                      </div>
                    );
                  })()}

                  <button
                    onClick={(e) => handleBookmark(e, course.id)}
                    className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition ${isBookmarked ? "bg-accent text-white" : "bg-black/50 text-white hover:bg-accent"}`}
                  >
                    <i
                      className={`${isBookmarked ? "fas" : "far"} fa-bookmark text-sm`}
                    ></i>
                  </button>

                  {course.type === "قناة يوتيوب" && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/40">
                      <i className="fas fa-play-circle text-5xl text-white drop-shadow-lg"></i>
                    </div>
                  )}
                </div>

                <div className="px-1 flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg leading-tight mb-1 text-white group-hover:text-accent transition line-clamp-1">
                      {course.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    <i
                      className={`fas ${getTypeIcon(course.type).split(" ")[0]}`}
                    ></i>{" "}
                    {course.type}
                  </p>
                  <p className="text-xs text-gray-300 line-clamp-2 h-8 mb-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <button
                      onClick={(e) => handleLike(e, course)}
                      className={`transition flex items-center gap-1 ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                    >
                      <i className={`${isLiked ? "fas" : "far"} fa-heart`}></i>
                      {(course.likes || 0) > 0 && (
                        <span className="text-xs">{course.likes}</span>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {(currentUser?.role === "admin" || currentUser?.role === "super_admin" || currentUser?.id === course.addedById || currentUser?.name === course.addedBy) && (
                        <button
                          onClick={(e) => handleDelete(e, course.id)}
                          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await Browser.open({ url: course.link });
                        }}
                        className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white px-6 py-1.5 rounded-full text-sm font-medium shadow-lg transition transform active:scale-95"
                      >
                        {course.type === "كتب" ? "قراءة" : "فتح"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
         )}
        </div>
        {!loadingData && filteredCourses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا يوجد محتوى متاح حالياً
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="✨ إضافة مصدر تعليمي جديد"
      >
        <div className="space-y-6 font-tajawal pb-10">
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-indigo-500 p-[3px] shadow-lg shadow-accent/20">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-black">
                  <Icons.GraduationCap className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white text-xl">إضافة مصدر</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/5 flex items-center gap-1">
                    <Icons.Globe className="w-3 h-3" /> مشاركة تعليمية
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="عنوان المصدر التعليمي..."
                className="input-style w-full px-4 py-4 rounded-2xl font-bold text-2xl border-none bg-transparent focus:ring-0 placeholder:text-gray-700 text-white"
              />
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4" />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="وصف موجز للمحتوى وما سيستفيده المتعلم..."
                className="input-style w-full px-4 py-4 rounded-2xl h-48 resize-none leading-relaxed border-none bg-transparent focus:ring-0 placeholder:text-gray-700 text-xl text-gray-200"
              ></textarea>
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4" />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                type="text"
                placeholder="رابط المصدر (YouTube, Drive, Website)..."
                className="input-style w-full px-4 py-4 rounded-2xl border-none bg-transparent focus:ring-0 placeholder:text-gray-700 text-blue-400 font-medium text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-gray-500 text-xs font-bold mr-4">نوع المصدر</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-style w-full px-6 py-4 rounded-2xl appearance-none bg-white/5 border border-white/10 font-bold text-base shadow-lg"
              >
                {filters.filter(f => f.key !== "all").map((t) => (
                  <option key={t.key} value={t.key} className="bg-slate-900">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                className="btn-primary w-full py-4 rounded-2xl font-bold text-xl shadow-2xl shadow-accent/30 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                <span>إضافة المصدر الآن</span>
                <Icons.Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        message="هل أنت متأكد من حذف هذا المصدر التعليمي؟"
        confirmText="حذف"
      />
    </div>
  );
};
