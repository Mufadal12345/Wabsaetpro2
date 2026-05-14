import { UserRole } from "../../auth/types/auth.types";

export interface Idea {
  id: string;
  type?: "text" | "image" | "video" | "link";
  title: string;
  category: string;
  content: string;
  author: string; // authorName
  authorId: string;
  authorRole: UserRole;
  views: number;
  likes: number;
  likedBy?: string[]; // array of user IDs who liked it
  featured: boolean;
  deleted: boolean;
  createdAt: string;
  showAfter?: string;
  hashtags?: string[];
  isPinned?: boolean;
  pinnedAt?: string;
  imageUrl?: string;
}

export interface IdeaCreateInput {
  title: string;
  content: string;
  category: string;
  type?: "text" | "image" | "video" | "link";
  hashtags?: string[];
  imageUrl?: string;
}

export interface IdeaUpdateInput {
  title?: string;
  content?: string;
  category?: string;
  type?: "text" | "image" | "video" | "link";
  hashtags?: string[];
  imageUrl?: string;
  views?: number;
  likes?: number;
  featured?: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
}
