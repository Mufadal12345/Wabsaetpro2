import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { Idea, User, IdeaComment, SystemNotification, AdminGroupMessage, AuditLog, Suggestion, Message, Quote, Course, Bookmark, Follow, SectionItem } from "../types";

export const useIdeas = (pageSize = 10) => {
  return useInfiniteQuery<
    { ideas: Idea[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined },
    Error,
    // The InfiniteData structure requires an array of pages
    { pages: { ideas: Idea[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined }[]; pageParams: (QueryDocumentSnapshot<DocumentData> | undefined)[] },
    (string | number)[],
    QueryDocumentSnapshot<DocumentData> | undefined
  >({
    queryKey: ["ideas", pageSize],
    queryFn: async ({ pageParam }) => {
      let q = query(
        collection(db, "ideas"),
        where("deleted", "==", false),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }
      const snap = await getDocs(q);
      const ideas = snap.docs.map(d => ({ id: d.id, ...d.data() } as Idea));
      return { ideas, lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.lastVisible,
  });
};

export const useAllComments = (pageSize = 50) => {
  return useInfiniteQuery<
    { comments: IdeaComment[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined },
    Error,
    { pages: { comments: IdeaComment[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined }[]; pageParams: (QueryDocumentSnapshot<DocumentData> | undefined)[] },
    (string | number)[],
    QueryDocumentSnapshot<DocumentData> | undefined
  >({
    queryKey: ["comments", "all", pageSize],
    queryFn: async ({ pageParam }) => {
      let q = query(collection(db, "comments"), orderBy("createdAt", "desc"), limit(pageSize));
      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }
      const snap = await getDocs(q);
      const comments = snap.docs.map(d => ({ id: d.id, ...d.data() } as IdeaComment));
      return { comments, lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.lastVisible,
  });
};

export const useAuditLogs = (pageSize = 50) => {
  return useInfiniteQuery<
    { logs: AuditLog[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined },
    Error,
    { pages: { logs: AuditLog[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined }[]; pageParams: (QueryDocumentSnapshot<DocumentData> | undefined)[] },
    (string | number)[],
    QueryDocumentSnapshot<DocumentData> | undefined
  >({
    queryKey: ["audit-logs", pageSize],
    queryFn: async ({ pageParam }) => {
      let q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(pageSize));
      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }
      const snap = await getDocs(q);
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
      return { logs, lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.lastVisible,
  });
};

export const useIdeaLikes = (ideaId: string, userId?: string) => {
  return useQuery({
    queryKey: ["idea-likes", ideaId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const d = await getDoc(doc(db, "ideas", ideaId, "likes", userId));
      return d.exists();
    },
    enabled: !!ideaId && !!userId
  });
};

export const useUsers = (pageSize = 50) => {
  return useInfiniteQuery<
    { users: User[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined },
    Error,
    { pages: { users: User[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined }[]; pageParams: (QueryDocumentSnapshot<DocumentData> | undefined)[] },
    (string | number)[],
    QueryDocumentSnapshot<DocumentData> | undefined
  >({
    queryKey: ["users", pageSize],
    queryFn: async ({ pageParam }) => {
      let q = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }
      const snap = await getDocs(q);
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      return { users, lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.lastVisible,
  });
};

export const useIdeaComments = (ideaId: string) => {
  return useQuery({
    queryKey: ["comments", ideaId],
    queryFn: async () => {
      const q = query(collection(db, "comments"), where("ideaId", "==", ideaId), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as IdeaComment));
    },
    enabled: !!ideaId
  });
};

export const useAboutSections = () => {
  return useQuery({
    queryKey: ["about-sections"],
    queryFn: async () => {
      const q = query(collection(db, "about_sections"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    }
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemNotification));
    }
  });
};


export const useAdminChats = () => {
  return useQuery({
    queryKey: ["admin-chats"],
    queryFn: async () => {
      const q = query(collection(db, "admin_chats"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminGroupMessage));
    }
  });
};

export const useSuggestions = () => {
  return useQuery<Suggestion[]>({
    queryKey: ["suggestions"],
    queryFn: async () => {
      const q = query(collection(db, "suggestions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Suggestion));
    }
  });
};

export const useMessages = () => {
  return useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    }
  });
};

export const useQuotes = () => {
  return useQuery<Quote[]>({
    queryKey: ["quotes"],
    queryFn: async () => {
      const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote));
    }
  });
};

export const useCourses = () => {
  return useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
    }
  });
};

export const useBookmarks = () => {
  return useQuery<Bookmark[]>({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const q = query(collection(db, "bookmarks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Bookmark));
    }
  });
};

export const useFollows = () => {
  return useQuery<Follow[]>({
    queryKey: ["follows"],
    queryFn: async () => {
      const q = query(collection(db, "follows"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Follow));
    }
  });
};

export const useSectionItems = () => {
  return useQuery<SectionItem[]>({
    queryKey: ["section-items"],
    queryFn: async () => {
      const q = query(collection(db, "section_items"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SectionItem));
    }
  });
};

