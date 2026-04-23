import React, { useState } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { SystemNotification } from "../../types";
import { Icons } from "../../components/Icons";
import { useQueryClient } from "@tanstack/react-query";

export const AdminNotifications: React.FC = () => {
  const queryClient = useQueryClient();
  const { notifications } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<SystemNotification["type"]>("info");
  const [actionType, setActionType] = useState<SystemNotification["actionType"]>("none");
  const [actionLink, setActionLink] = useState("");
  const [actionText, setActionText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, "notifications", editingId), {
          title,
          content,
          type,
          actionType: actionType || "none",
          actionLink: actionLink || "",
          actionText: actionText || "",
        });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        showToast("تم تحديث التنبيه بنجاح", "success");
      } else {
        await addDoc(collection(db, "notifications"), {
          title,
          content,
          type,
          actionType: actionType || "none",
          actionLink: actionLink || "",
          actionText: actionText || "",
          createdBy: currentUser.id,
          createdAt: new Date().toISOString(),
          active: true,
        });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        showToast("تم إرسال التنبيه بنجاح", "success");
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "notifications");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setType("info");
    setActionType("none");
    setActionLink("");
    setActionText("");
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEdit = (n: SystemNotification) => {
    setTitle(n.title);
    setContent(n.content);
    setType(n.type);
    setActionType(n.actionType || "none");
    setActionLink(n.actionLink || "");
    setActionText(n.actionText || "");
    setEditingId(n.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التنبيه؟")) return;
    try {
      await deleteDoc(doc(db, "notifications", id));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showToast("تم حذف التنبيه", "info");
    } catch (error) {
      console.error("Delete notification error:", error);
      showToast("فشل حذف التنبيه", "error");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "notifications", id), {
        active: !currentStatus,
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "notifications");
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-amiri gradient-text">إدارة التنبيهات</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary px-6 py-2 rounded-xl flex items-center gap-2"
        >
          <Icons.Plus className="w-5 h-5" />
          إضافة تنبيه جديد
        </button>
      </div>

      <div className="grid gap-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`glass-card p-5 rounded-2xl border-r-4 ${
              n.type === "info" ? "border-blue-500" :
              n.type === "warning" ? "border-yellow-500" :
              n.type === "error" ? "border-red-500" : "border-green-500"
            } ${!n.active ? "opacity-60" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg mb-1">{n.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{n.content}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{new Date(n.createdAt).toLocaleString("ar-EG")}</span>
                  <span className={`px-2 py-0.5 rounded-full bg-white/5 ${
                    n.type === "info" ? "text-blue-400" :
                    n.type === "warning" ? "text-yellow-400" :
                    n.type === "error" ? "text-red-400" : "text-green-400"
                  }`}>
                    {n.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(n.id, n.active)}
                  className={`p-2 rounded-lg transition-colors ${
                    n.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                  }`}
                  title={n.active ? "إيقاف" : "تفعيل"}
                >
                  <Icons.Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(n)}
                  className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <Icons.Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Icons.Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-20 glass-card rounded-2xl">
            <p className="text-gray-500">لا توجد تنبيهات مرسلة حالياً</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? "تعديل التنبيه" : "إضافة تنبيه جديد"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-full">
                <Icons.X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">عنوان التنبيه</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-style w-full p-3 rounded-xl bg-white/5 border-white/10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">نوع التنبيه</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="input-style w-full p-3 rounded-xl bg-white/5 border-white/10"
                >
                  <option value="info">معلومة (أزرق)</option>
                  <option value="success">نجاح (أخضر)</option>
                  <option value="warning">تحذير (أصفر)</option>
                  <option value="error">خطأ (أحمر)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">محتوى التنبيه</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input-style w-full p-3 rounded-xl bg-white/5 border-white/10 h-32 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">إجراء التنبيه (اختياري)</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="input-style w-full p-3 rounded-xl bg-white/5 border-white/10 mb-2"
                >
                  <option value="none">بدون إجراء</option>
                  <option value="link">فتح رابط (داخلي أو خارجي)</option>
                  <option value="level_up">فتح شاشة الترقية</option>
                </select>
                
                {actionType === "link" && (
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      placeholder="رابط الإجراء (مثال: /ideas أو https://...)"
                      value={actionLink}
                      onChange={(e) => setActionLink(e.target.value)}
                      className="input-style w-full p-3 rounded-xl bg-white/5 border-white/10"
                    />
                    <input
                      type="text"
                      placeholder="نص الزر (مثال: اضغط هنا)"
                      value={actionText}
                      onChange={(e) => setActionText(e.target.value)}
                      className="input-style w-full p-3 rounded-xl bg-white/5 border-white/10"
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary w-full py-3 rounded-xl font-bold">
                {editingId ? "تحديث التنبيه" : "إرسال التنبيه الآن"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
