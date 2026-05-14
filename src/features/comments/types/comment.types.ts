import { UserRole } from "../../auth/types/auth.types";

export interface Comment {
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

export interface CommentCreateInput {
  ideaId: string;
  text: string;
  parentCommentId?: string | null;
}
