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

    const userIdeasCount = ideas.filter(i => i.authorId === currentUser.id && !i.deleted).length;
    const currentLevelInfo = calculateUserLevel(userIdeasCount);
    
    // Check if we have seen this level
    const seenLevelStr = localStorage.getItem(`muf_seen_level_${currentUser.id}`);
    const seenLevel = seenLevelStr ? parseInt(seenLevelStr, 10) : 1;

    if (currentLevelInfo.level > seenLevel) {
      // User leveled up!
      setNewLevel(currentLevelInfo);
      showToast(`تهانينا! لقد وصلت إلى المستوى ${currentLevelInfo.level}`, "success");
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
