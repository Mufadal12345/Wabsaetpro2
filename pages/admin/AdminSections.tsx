import React, { useState } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { Icons } from "../../components/Icons";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { addDoc, collection, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { Modal } from "./Modal";
import { useQueryClient } from "@tanstack/react-query";

export const AdminSections: React.FC = () => {
  const queryClient = useQueryClient();
  const { aboutSections } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isProjectInfo, setIsProjectInfo] = useState(false);

  const mainSections = [
    { id: "home", title: "الرئيسية", icon: "🏠", path: "/" },
    { id: "ideas", title: "الأفكار", icon: "💡", path: "/ideas" },
    { id: "content", title: "المحتوى", icon: "📚", path: "/content" },
    { id: "philosophy", title: "الفلسفة", icon: "🧠", path: "/philosophy" },
    { id: "quotes", title: "العبارات الملهمة", icon: "✨", path: "/quotes" },
    { id: "skills", title: "تطوير المهارات", icon: "🚀", path: "/skills" },
    { id: "suggestions", title: "الرسائل والاقتراحات", icon: "📝", path: "/suggestions" },
    { id: "about", title: "عن المشروع", icon: "ℹ️", path: "/about" },
  ];

  const resetForm = () => {
    setTitle("");
    setContent("");
    setOrder(aboutSections.length);
    setIsVisible(true);
    setIsProjectInfo(false);
    setEditingSection(null);
  };

  const handleOpenEdit = (section: any) => {
    setEditingSection(section);
    setTitle(section.title);
    setContent(section.content);
    setOrder(section.order);
    setIsVisible(section.isVisible);
    setIsProjectInfo(section.isProjectInfo || false);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!title) return;
    
    // Close modal immediately
    setIsModalOpen(false);
    const sectionToEdit = editingSection;
    const isEditing = !!editingSection;
    resetForm();

    try {
      if (isEditing) {
        await updateDoc(doc(db, "about_sections", sectionToEdit.id), {
          title,
          content,
          order: Number(order),
          isVisible,
          isProjectInfo,
        });
        queryClient.invalidateQueries({ queryKey: ["about-sections"] });
        showToast("تم تحديث القسم بنجاح", "success");
      } else {
        await addDoc(collection(db, "about_sections"), {
          title,
          content,
          order: Number(order),
          isVisible,
          isProjectInfo,
          ownerId: currentUser?.id,
          createdAt: new Date().toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: ["about-sections"] });
        showToast("تم إضافة القسم بنجاح", "success");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "about_sections");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    try {
      await deleteDoc(doc(db, "about_sections", id));
      queryClient.invalidateQueries({ queryKey: ["about-sections"] });
      showToast("تم حذف القسم", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "about_sections");
    }
  };

  const toggleVisibility = async (section: any, isStatic: boolean = false) => {
    try {
      const existing = aboutSections.find(s => s.id === section.id);
      if (existing) {
        await updateDoc(doc(db, "about_sections", existing.id), {
          isVisible: !existing.isVisible,
        });
      } else if (isStatic) {
        await setDoc(doc(db, "about_sections", section.id), {
          title: section.title,
          content: "قسم رئيسي",
          isVisible: false,
          order: -1,
          isProjectInfo: false,
          createdAt: new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["about-sections"] });
      showToast("تم تحديث الحالة", "info");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "about_sections");
    }
  };

  return (
    <div className="animate-fade-in pb-20 font-tajawal">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-amiri gradient-text">إدارة الأقسام</h1>
          <p className="text-gray-400">التحكم في أقسام القائمة الجانبية وصفحة المشروع</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn-primary px-6 py-2 rounded-xl flex items-center gap-2"
        >
          <Icons.Plus className="w-5 h-5" />
          إضافة قسم جديد
        </button>
      </div>

      <div className="space-y-12">
        {/* Main Sections */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-pink-500 rounded-full"></span>
            الأقسام الرئيسية (الثابتة)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mainSections.map(section => {
              const dbSection = aboutSections.find(s => s.id === section.id);
              const isVisible = dbSection ? dbSection.isVisible : true;
              return (
                <div key={section.id} className={`glass-card p-4 rounded-2xl flex items-center justify-between ${!isVisible ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-bold text-sm">{section.title}</span>
                  </div>
                  <button
                    onClick={() => toggleVisibility(section, true)}
                    className={`p-2 rounded-lg ${isVisible ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}
                  >
                    {isVisible ? <Icons.Eye className="w-4 h-4" /> : <Icons.EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dynamic Sections */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-accent rounded-full"></span>
            الأقسام المضافة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aboutSections.filter(s => !mainSections.some(ms => ms.id === s.id)).map(section => (
              <div key={section.id} className={`glass-card p-5 rounded-2xl border border-white/5 ${!section.isVisible ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold">{section.title}</h3>
                    <span className="text-[10px] text-gray-500">
                      {section.isProjectInfo ? "صفحة المشروع" : "القائمة الجانبية"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleVisibility(section)} className="p-2 bg-white/5 rounded-lg">
                      {section.isVisible ? <Icons.Eye className="w-4 h-4 text-green-400" /> : <Icons.EyeOff className="w-4 h-4 text-yellow-400" />}
                    </button>
                    <button onClick={() => handleOpenEdit(section)} className="p-2 bg-white/5 rounded-lg text-blue-400">
                      <Icons.Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(section.id)} className="p-2 bg-white/5 rounded-lg text-red-400">
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{section.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSection ? "تعديل القسم" : "إضافة قسم جديد"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">العنوان</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-style w-full p-3 rounded-xl"
              placeholder="عنوان القسم..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">المحتوى</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-style w-full p-3 rounded-xl h-32 resize-none"
              placeholder="وصف القسم..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الترتيب</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="input-style w-full p-3 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-5 h-5 accent-pink-500"
              />
              <span className="text-sm">مرئي للجميع</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isProjectInfo}
              onChange={(e) => setIsProjectInfo(e.target.checked)}
              className="w-5 h-5 accent-purple-500"
            />
            <span className="text-sm">هذا القسم خاص بصفحة "عن المشروع"</span>
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full py-3 rounded-xl font-bold mt-4">
            {editingSection ? "حفظ التغييرات" : "إضافة القسم الآن"}
          </button>
        </div>
      </Modal>
    </div>
  );
};
