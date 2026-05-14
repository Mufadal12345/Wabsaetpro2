import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";

export const useSidebarBadges = (userId: string) => {
  return useQuery({
    queryKey: ["sidebar-badges", userId],
    queryFn: async () => {
      // جلب الرسائل غير المقروءة
      const msgQuery = query(
        collection(db, "messages"),
        where("toUserId", "==", userId),
        where("read", "==", false)
      );
      
      // جلب التنبيهات غير المقروءة
      const notifQuery = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("read", "==", false)
      );

      const [msgSnap, notifSnap] = await Promise.all([
        getDocs(msgQuery),
        getDocs(notifQuery)
      ]);

      return {
        unread_messages: msgSnap.size,
        unread_notifications: notifSnap.size,
        draft_count: 0, 
      };
    },
    refetchInterval: 30000,
  });
};
