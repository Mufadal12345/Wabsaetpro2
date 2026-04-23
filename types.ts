export type UserRole = "super_admin" | "admin" | "user";

export interface SystemNotification {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "error" | "success";
  createdBy: string;
  createdAt: string;
  active: boolean;
  actionType?: "none" | "link" | "level_up";
  actionLink?: string;
  actionText?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  actionType: "ban_user" | "unban_user" | "promote_admin" | "demote_admin" | "modify_permissions" | "delete_idea" | "update_settings";
  targetId?: string;
  targetName?: string;
  details?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  specialty: string;
  role: UserRole;
  isBanned: boolean;
  banUntil?: string; // ISO string when the ban expires
  banReason?: string;
  authMethod: string;
  emailVerified: boolean;
  photoURL?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  adminPermissions?: string[]; // e.g. 'manage_suggestions', 'message_members', 'manage_admins', 'ban_members', 'view_members'
  createdAt: string;
  lastLogin?: string;
}

export interface AdminGroupMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  authorId: string;
  authorRole: UserRole;
  views: number;
  likes: number;
  featured: boolean;
  deleted: boolean;
  createdAt: string;
  showAfter?: string;
  hashtags?: string[];
  isPinned?: boolean;
  pinnedAt?: string;
}

export interface IdeaComment {
  id: string;
  ideaId: string;
  text: string;
  userId: string;
  authorName: string;
  authorRole: UserRole;
  likes: number;
  likedBy: string[];
  parentCommentId: string | null;
  replies: number;
  deleted: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  type: string;
  description: string;
  link: string;
  preview?: LinkPreview;
  addedBy: string;
  addedById?: string;
  addedByRole: UserRole;
  createdAt: string;
  likes?: number;
  likedBy?: string[];
  views?: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
}

export interface LinkPreview {
  title: string;
  description: string;
  image: string | null;
  domain: string;
  url: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  addedBy?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  type: string;
  suggestionType: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  status: "pending" | "approved" | "rejected" | "replied";
  createdAt: string;
  replyContent?: string;
  repliedBy?: string;
  repliedAt?: string;
}

export interface Message {
  id: string;
  title: string;
  type: string;
  content: string;
  from: string;
  fromId: string;
  toUserId?: string;
  status: string;
  read: boolean;
  createdAt: string;
}

export interface AboutSection {
  id: string;
  title: string;
  content: string;
  isVisible: boolean;
  order: number;
  ownerId?: string;
  hiddenByOwner?: boolean;
  isProjectInfo?: boolean;
  createdAt: string;
}

export interface SectionItem {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  image?: string;
  createdAt: string;
}

export interface AdminMessage {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "error" | "success";
  from: string;
  fromId: string;
  toUserId: string;
  read: boolean;
  createdAt: string;
}

export const ADMINS = [
  { name: "Rasha", code: "20250929" },
  { name: "MUF", code: "CS" },
];

export const CATEGORY_ICONS: Record<string, string> = {
  فلسفة: "🧠",
  تقنية: "💻",
  أدب: "📖",
  علوم: "🔬",
  فن: "🎨",
  اجتماع: "👥",
};

export const COURSE_ICONS: Record<string, string> = {
  "قناة يوتيوب": "📺",
  "كورس أونلاين": "🎓",
  "منصة تعليمية": "💻",
  مقالات: "📝",
  كتب: "📚",
  بودكاست: "🎙️",
};

export const roleIcons: Record<string, string> = {
  admin: "👑",
  user: "👤",
};
