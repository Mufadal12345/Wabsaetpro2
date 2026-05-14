import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "../components/Icons";
import { Modal } from "./admin/Modal";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useToast } from "../contexts/ToastContext";
import { SectionItem } from "../types";

export const SectionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { aboutSections, sectionItems } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SectionItem | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");

  const section = aboutSections.find((s) => s.id === id);
  const items = sectionItems.filter((item) => item.sectionId === id);
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  if (!section || (!section.isVisible && !isAdmin)) {
    return <Navigate to="/" />;
  }

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImage("");
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SectionItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setImage(item.image || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!title || !content) return;

    try {
      if (editingItem) {
        await updateDoc(doc(db, "section_items", editingItem.id), {
          title,
          content,
          image,
        });
        showToast("تم التحديث بنجاح", "success");
      } else {
        await addDoc(collection(db, "section_items"), {
          sectionId: id,
          title,
          content,
          image,
          createdAt: new Date().toISOString(),
        });
        showToast("تمت الإضافة بنجاح", "success");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "section_items");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await deleteDoc(doc(db, "section_items", itemId));
      showToast("تم الحذف", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "section_items");
    }
  };

  return (
    <div className="animate-fade-in pb-20 max-w-5xl mx-auto font-tajawal">
      {/* Header Section */}
      <div className="glass-card rounded-3xl p-8 md:p-12 border-t-4 border-accent relative overflow-hidden mb-12 text-center">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-accent/5 to-transparent pointer-events-none"></div>
        
        <h1 className="text-3xl md:text-5xl font-bold font-amiri text-white mb-6 neon-text">
          {section.title}
        </h1>
        
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          {section.content}
        </p>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="btn-primary px-8 py-3 rounded-full mt-8 flex items-center gap-2 mx-auto shadow-lg hover:scale-105 transition-transform"
          >
            <Icons.Plus className="w-5 h-5" /> إضافة محتوى جديد
          </button>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.map((item) => (
          <div key={item.id} className="glass-card rounded-3xl overflow-hidden flex flex-col group border border-white/5 hover:border-accent/30 transition-all duration-500">
            {item.image && (
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000] to-transparent opacity-60"></div>
              </div>
            )}
            
            <div className="p-6 flex-1 flex flex-col relative">
              {isAdmin && (
                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition-colors"
                  >
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-4 text-right">
                {item.title}
              </h3>
              
              <div className="text-gray-400 text-sm leading-relaxed text-right whitespace-pre-wrap flex-1">
                {item.content}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-gray-600 text-left">
                {new Date(item.createdAt).toLocaleDateString('ar-EG')}
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-500 italic bg-white/5 rounded-3xl border border-dashed border-white/10">
            لا يوجد محتوى مضاف في هذا القسم بعد.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "تعديل المحتوى" : "إضافة محتوى جديد"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">العنوان</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-style w-full px-4 py-2 rounded-xl"
              placeholder="عنوان المحتوى..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">رابط الصورة (اختياري)</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="input-style w-full px-4 py-2 rounded-xl"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">التفاصيل</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-style w-full px-4 py-2 rounded-xl h-48 resize-none"
              placeholder="اكتب المحتوى هنا..."
            />
          </div>
          <button
            onClick={handleSubmit}
            className="btn-primary w-full py-3 rounded-xl shadow-lg mt-4"
          >
            {editingItem ? "حفظ التغييرات" : "إضافة الآن"}
          </button>
        </div>
      </Modal>
    </div>
  );
};
