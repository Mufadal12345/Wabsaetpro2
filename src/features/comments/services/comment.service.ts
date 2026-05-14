import { 
  where, 
  orderBy, 
  doc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../../../firebase';
import { FirestoreService } from '../../../services/firebase/firebase.service';
import { Comment, CommentCreateInput } from '../types/comment.types';
import { UserProfile } from '../../auth/types/auth.types';

export const CommentService = {
  async getCommentsByIdeaId(ideaId: string): Promise<Comment[]> {
    return FirestoreService.queryDocuments<Comment>(
      'comments',
      where('ideaId', '==', ideaId),
      orderBy('createdAt', 'asc')
    );
  },

  async addComment(data: CommentCreateInput, author: UserProfile): Promise<Comment> {
    const newComment: Omit<Comment, 'id'> = {
      ideaId: data.ideaId,
      text: data.text,
      userId: author.id,
      authorName: author.name,
      authorRole: author.role,
      likes: 0,
      likedBy: [],
      parentCommentId: data.parentCommentId || null,
      replies: 0,
      deleted: false,
      createdAt: new Date().toISOString(),
    };

    const id = await FirestoreService.addDocument('comments', newComment);

    return { id, ...newComment } as Comment;
  },

  async deleteComment(commentId: string): Promise<void> {
    // For a real app, maybe soft delete to keep replies tree. 
    // Updating 'deleted: true' is a simple soft delete.
    await FirestoreService.updateDocument('comments', commentId, { deleted: true });
  },

  async toggleLikeComment(commentId: string, userId: string): Promise<void> {
    const commentRef = doc(db, 'comments', commentId);
    
    await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef);
      if (!commentDoc.exists()) throw new Error("Comment does not exist!");

      const data = commentDoc.data();
      const likedBy = data.likedBy || [];
      const isLiked = likedBy.includes(userId);

      if (isLiked) {
        transaction.update(commentRef, {
          likedBy: likedBy.filter((id: string) => id !== userId),
          likes: Math.max(0, (data.likes || 1) - 1)
        });
      } else {
        transaction.update(commentRef, {
          likedBy: [...likedBy, userId],
          likes: (data.likes || 0) + 1
        });
      }
    });
  }
};
