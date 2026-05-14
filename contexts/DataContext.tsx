import React, { createContext, useContext, ReactNode } from "react";
import { useIdeas, useUsers, useAllComments, useAuditLogs, useAboutSections, useNotifications, useAdminChats, useSuggestions, useMessages, useQuotes, useCourses, useBookmarks, useFollows, useSectionItems, useSocialRelation } from "../hooks/useAppQueries";
import { useAuth } from "./AuthContext";
import { Idea, User, IdeaComment, Suggestion, SystemNotification, AboutSection, Bookmark, Course, AdminGroupMessage, Message, AuditLog, Quote, Follow, SectionItem } from "../types";

// Keep interface identical so other files don't TS error out
interface DataContextType {
  ideas: Idea[];
  comments: IdeaComment[];
  courses: Course[];
  quotes: Quote[];
  suggestions: Suggestion[];
  users: User[];
  follows: Follow[];
  currentUserFollowing: string[];
  messages: Message[];
  bookmarks: Bookmark[];
  notifications: SystemNotification[];
  adminChats: AdminGroupMessage[];
  aboutSections: AboutSection[];
  sectionItems: SectionItem[];
  auditLogs: AuditLog[];
  loadingData: boolean;
  now: Date;
  hasMoreIdeas: boolean;
  loadingMoreIdeas: boolean;
  loadMoreIdeas: () => Promise<void>;
  hasMoreUsers: boolean;
  loadingMoreUsers: boolean;
  loadMoreUsers: () => Promise<void>;
  hasMoreComments: boolean;
  loadingMoreComments: boolean;
  loadMoreComments: () => Promise<void>;
  hasMoreAudit: boolean;
  loadingMoreAudit: boolean;
  loadMoreAudit: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

// Proxy the data layer to React Query.
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { data: ideasData, isLoading: ideasLoading, fetchNextPage: loadMoreIdeas, hasNextPage: hasMoreIdeas, isFetchingNextPage: loadingMoreIdeas } = useIdeas(20);
  const { data: usersData, isLoading: usersLoading, fetchNextPage: loadMoreUsers, hasNextPage: hasMoreUsers, isFetchingNextPage: loadingMoreUsers } = useUsers(50);
  const { data: commentsData, fetchNextPage: loadMoreComments, hasNextPage: hasMoreComments, isFetchingNextPage: loadingMoreComments } = useAllComments(50);
  const { data: auditData, fetchNextPage: loadMoreAudit, hasNextPage: hasMoreAudit, isFetchingNextPage: loadingMoreAudit } = useAuditLogs(50);

  const { data: aboutSectionsData } = useAboutSections();
  const { data: notificationsData } = useNotifications();
  const { data: adminChatsData } = useAdminChats();
  const { data: suggestionsData } = useSuggestions();
  const { data: messagesData } = useMessages();
  const { data: quotesData } = useQuotes();
  const { data: coursesData } = useCourses();
  const { data: bookmarksData } = useBookmarks();
  const { data: followsData } = useFollows();
  const { data: sectionItemsData } = useSectionItems();
  const { data: currentUserSocialData } = useSocialRelation(currentUser?.id || "");

  const val: DataContextType = {
    ideas: ideasData?.pages.flatMap(p => p.ideas) || [],
    users: usersData?.pages.flatMap(p => p.users) || [],
    comments: commentsData?.pages.flatMap(p => p.comments) || [],
    auditLogs: auditData?.pages.flatMap(p => p.logs) || [],
    
    // البيانات التي أصبحت حية الآن
    aboutSections: aboutSectionsData || [],
    notifications: notificationsData || [],
    adminChats: adminChatsData || [],
    suggestions: suggestionsData || [],
    messages: messagesData || [],
    quotes: quotesData || [],
    courses: coursesData || [],
    bookmarks: bookmarksData || [],
    follows: followsData || [],
    currentUserFollowing: currentUserSocialData?.following || [],
    sectionItems: sectionItemsData || [],

    loadingData: ideasLoading || usersLoading,
    now: new Date(),
    hasMoreIdeas: !!hasMoreIdeas,
    loadingMoreIdeas: loadingMoreIdeas,
    loadMoreIdeas: async () => { await loadMoreIdeas(); },
    hasMoreUsers: !!hasMoreUsers,
    loadingMoreUsers: loadingMoreUsers,
    loadMoreUsers: async () => { await loadMoreUsers(); },
    hasMoreComments: !!hasMoreComments,
    loadingMoreComments: loadingMoreComments,
    loadMoreComments: async () => { await loadMoreComments(); },
    hasMoreAudit: !!hasMoreAudit,
    loadingMoreAudit: loadingMoreAudit,
    loadMoreAudit: async () => { await loadMoreAudit(); },
  };

  return <DataContext.Provider value={val}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
