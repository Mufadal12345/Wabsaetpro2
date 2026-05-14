import React, { useState, useRef, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { Icons } from "../Icons";
import { UserAvatar } from "../UserAvatar";
import { addDoc, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { parseHashtags } from "../../utils";
import { useToast } from "../../contexts/ToastContext";
import { useQueryClient } from "@tanstack/react-query";

export const QuickPost: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { aboutSections } = useData();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [category, setCategory] = useState("أخرى");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic categories based on Admin Sections + Default Categories
  const dynamicCategories = useMemo(() => {
    const defaults = ["فلسفة", "تعليم", "تكنولوجيا", "فن", "تطوير المهارات", "أخرى"];
    const sectionTitles = aboutSections
      .filter(s => s.isVisible && !s.isProjectInfo)
      .map(s => s.title);
    
    // Merge and remove duplicates
    const combined = Array.from(new Set([...defaults, ...sectionTitles]));
    return combined;
  }, [aboutSections]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handlePost = async () => {
    if (!content.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const hashtags = parseHashtags(content);
      // Derive a professional title
      const lines = content.trim().split('\n');
      const firstLine = lines[0].substring(0, 80);
      const title = firstLine || "خاطرة جديدة";

      // Everything published here goes to 'ideas' collection (The Master Feed)
      // This ensures it appears in Ideas.tsx and Home.tsx
      await addDoc(collection(db, "ideas"), {
        title: title,
        category: category || "أخرى",
        content: content.trim(),
        hashtags,
        author: currentUser.name,
        authorId: currentUser.id,
        authorRole: currentUser.role,
        views: 0,
        likes: 0,
        featured: false,
        deleted: false,
        createdAt: new Date().toISOString(),
      });

      // CRITICAL: Invalidate queries so the new post appears immediately in all feeds
      queryClient.invalidateQueries({ queryKey: ["ideas"] });

      setContent("");
      setIsExpanded(false);
      setCategory("أخرى");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      showToast("تم نشر فكرتك بنجاح! تظهر الآن في الواجهة الرئيسية وقسم الأفكار.", "success");
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.CREATE, "ideas");
      showToast("فشل نشر الفكرة، يرجى المحاولة مرة أخرى", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="glass-card rounded-[2rem] p-4 md:p-6 mb-8 border border-white/10 shadow-xl transition-all relative overflow-hidden group">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
      
      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-1">
          <UserAvatar user={currentUser} className="w-10 h-10 shadow-lg" />
        </div>
        
        <div className="flex-grow flex flex-col">
          <textarea
            ref={textareaRef}
            rows={isExpanded ? 3 : 1}
            value={content}
            onChange={handleInput}
            onFocus={() => setIsExpanded(true)}
            placeholder="وش فكرتك اليوم؟ شاركنا إياها..."
            className="w-full bg-transparent border-none text-white text-lg placeholder:text-gray-500 focus:outline-none focus:ring-0 resize-none transition-all duration-300"
            style={{ minHeight: isExpanded ? "80px" : "32px" }}
          />

          {isExpanded && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-4 border-t border-white/5 gap-4 animate-fade-in text-right">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide flex-row-reverse">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border ${
                      category === cat
                        ? "bg-accent/20 text-accent border-accent/40 shadow-lg shadow-accent/10"
                        : "bg-white/5 text-gray-500 hover:bg-white/10 border-transparent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setContent("");
                  }}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-white transition-colors"
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button
                  onClick={handlePost}
                  disabled={!content.trim() || isSubmitting}
                  className="bg-accent hover:bg-accent-light text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-accent/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icons.Send className="w-4 h-4" />
                  )}
                  <span>نشر الفكرة</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
