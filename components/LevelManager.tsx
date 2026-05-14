import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { calculateUserLevel, LevelInfo } from "../data/levels";
import { LevelUpModal } from "./LevelUpModal";
import { useToast } from "../contexts/ToastContext";

export const LevelManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { ideas } = useData();
  const { showToast } = useToast();
  const [newLevel, setNewLevel] = useState<LevelInfo | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const userIdeas = ideas.filter(i => i.authorId === currentUser.id && !i.deleted);
    const userIdeasCount = userIdeas.length;
    
    // Calculate total likes received on user's ideas
    const likesReceived = userIdeas.reduce((total, idea) => total + (idea.likes || 0), 0);
    
    // For comments count, we would ideally need a comments array from DataContext. 
    // Here we'll pass 0 for now as we don't have global comments readily available in Context.
    const commentsCount = 0; 
    
    const currentLevelInfo = calculateUserLevel(userIdeasCount, likesReceived, commentsCount);
    
    // Check if we have seen this level
    const seenLevelStr = localStorage.getItem(`muf_seen_level_${currentUser.id}`);
    const seenLevel = seenLevelStr ? parseInt(seenLevelStr, 10) : 1;

    if (currentLevelInfo.level > seenLevel) {
      // User leveled up!
      setNewLevel(currentLevelInfo);
      showToast(`تهانينا! لقد وصلت إلى المستوى ${currentLevelInfo.level}`, "success");
      
      // Auto promote to admin if level 5 is reached
      /*
      if (currentLevelInfo.level >= 5 && currentUser.role === "user") {
          import("firebase/firestore").then(({ doc, updateDoc }) => {
            import("../firebase").then(({ db }) => {
                updateDoc(doc(db, "users", currentUser.id), { role: "admin" })
                   .catch(err => console.error("Auto promote failed:", err));
            });
          });
      }
      */
    }
  }, [currentUser, ideas, showToast]);

  const handleCloseModal = () => {
    if (newLevel && currentUser) {
      localStorage.setItem(`muf_seen_level_${currentUser.id}`, newLevel.level.toString());
      setNewLevel(null);
    }
  };

  if (!newLevel) return null;

  return <LevelUpModal levelInfo={newLevel} onClose={handleCloseModal} />;
};
