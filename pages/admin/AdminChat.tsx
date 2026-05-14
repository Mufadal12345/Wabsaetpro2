import React, { useState, useRef, useEffect } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { Icons } from "../../components/Icons";
import { useToast } from "../../contexts/ToastContext";
import { useQueryClient } from "@tanstack/react-query";

export const AdminChat: React.FC = () => {
  const queryClient = useQueryClient();
  const { adminChats } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminChats]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, "admin_chats"), {
        text: message.trim(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-chats"] });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("فشل إرسال الرسالة", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      await deleteDoc(doc(db, "admin_chats", id));
      queryClient.invalidateQueries({ queryKey: ["admin-chats"] });
      showToast("تم حذف الرسالة بنجاح", "success");
    } catch (error) {
      console.error("Error deleting message:", error);
      showToast("فشل حذف الرسالة", "error");
    }
  };

  // Sort messages chronologically
  const sortedChats = [...adminChats].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col glass-card rounded-3xl overflow-hidden font-tajawal shadow-2xl border border-white/10">
      <header className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Icons.Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-amiri tracking-wide">غرفة عمليات الإدارة</h1>
            <p className="text-sm text-indigo-200 mt-1">مساحة آمنة ومشفرة للنقاش بين كبار المديرين</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
        {sortedChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
            <Icons.Message className="w-16 h-16 mb-4" />
            <p>لا توجد رسائل بعد. كن أول من يبدأ النقاش!</p>
          </div>
        ) : (
          sortedChats.map((chat) => {
            const isMe = chat.authorId === currentUser?.id;
            const canDelete = isMe || currentUser?.role === "super_admin";
            return (
              <div
                key={chat.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-slide-in`}
              >
                <div className="flex items-center gap-2 mb-1 px-2">
                  <span className="text-xs font-bold text-gray-400">
                    {chat.authorName}
                  </span>
                  {chat.authorId === currentUser?.id && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">أنت</span>
                  )}
                </div>
                <div className="group relative flex items-center gap-2">
                  {isMe && canDelete && (
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-all"
                      title="حذف الرسالة"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-md ${
                      isMe
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none"
                        : "bg-white/10 text-gray-100 rounded-tl-none border border-white/5"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{chat.text}</p>
                  </div>
                  {!isMe && canDelete && (
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-all"
                      title="حذف الرسالة"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 px-2 flex items-center gap-1">
                  <Icons.Clock className="w-3 h-3" />
                  {new Date(chat.createdAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
        <form onSubmit={handleSend} className="flex gap-3 items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="input-style flex-1 rounded-2xl px-6 py-4 bg-black/40 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-white placeholder-gray-500 transition-all"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95"
          >
            <Icons.Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};
