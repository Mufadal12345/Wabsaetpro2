import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  where,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  getDocs,
  runTransaction,
  doc
} from 'firebase/firestore';
import { db } from '../../../../firebase';
import { FirestoreService } from '../../../services/firebase/firebase.service';
import { Idea, IdeaCreateInput, IdeaUpdateInput } from '../types/idea.types';
import { UserProfile } from '../../auth/types/auth.types';

export const IdeaService = {
  async getIdeas(
    pageParam: QueryDocumentSnapshot<DocumentData> | null, 
    pageSize: number = 10,
    filters?: { category?: string; query?: string }
  ) {
    const constraints: QueryConstraint[] = [
      where("deleted", "==", false)
    ];

    if (filters?.category && filters.category !== "الكل" && filters.category !== "All") {
      constraints.push(where("category", "==", filters.category));
    }

    // Default order is by createdAt descending
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(pageSize));

    if (pageParam) {
      constraints.push(startAfter(pageParam));
    }

    try {
      const colRef = collection(db, "ideas");
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const ideas = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Idea[];

      // Filter by text search if needed (client side since Firestore lacks native full text search)
      let filteredIdeas = ideas;
      if (filters?.query) {
        const lowerQuery = filters.query.toLowerCase();
        filteredIdeas = ideas.filter(idea => 
          idea.title.toLowerCase().includes(lowerQuery) || 
          idea.content.toLowerCase().includes(lowerQuery) ||
          idea.author.toLowerCase().includes(lowerQuery)
        );
      }

      return {
        ideas: filteredIdeas,
        lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching ideas:", error);
      throw error;
    }
  },

  async getVisualIdeas(pageParam: QueryDocumentSnapshot<DocumentData> | null) {
    const constraints: QueryConstraint[] = [
      where("deleted", "==", false),
      where("type", "in", ["video", "link", "image"]), // جلب المحتوى المدعوم بصرياً فقط
      orderBy("createdAt", "desc"),
      limit(10)
    ];

    if (pageParam) {
      constraints.push(startAfter(pageParam));
    }

    try {
      const colRef = collection(db, "ideas");
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      
      return {
        ideas: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Idea[],
        lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === 10
      };
    } catch (error) {
      console.error("Error fetching visual feed:", error);
      throw error;
    }
  },

  async getIdeaById(id: string): Promise<Idea | null> {
    return FirestoreService.getDocument<Idea>('ideas', id);
  },

  async createIdea(data: IdeaCreateInput, author: UserProfile): Promise<Idea> {
    const newIdea = {
      ...data,
      author: author.name,
      authorId: author.id,
      authorRole: author.role,
      views: 0,
      likes: 0,
      likedBy: [],
      featured: false,
      deleted: false,
      createdAt: new Date().toISOString(),
    };

    const id = await FirestoreService.addDocument('ideas', newIdea);
    return { id, ...newIdea } as Idea;
  },

  async updateIdea(id: string, data: IdeaUpdateInput): Promise<void> {
    await FirestoreService.updateDocument('ideas', id, data);
  },

  async deleteIdea(id: string): Promise<void> {
    // Soft delete if that's the preferred way, but let's do hard delete for now, 
    // or rely on user preferences. 
    await FirestoreService.deleteDocument('ideas', id);
  },

  async toggleLike(ideaId: string, userId: string): Promise<{ liked: boolean; newLikesCount: number }> {
    const ideaRef = doc(db, 'ideas', ideaId);
    
    try {
      return await runTransaction(db, async (transaction) => {
        const ideaDoc = await transaction.get(ideaRef);
        if (!ideaDoc.exists()) {
          throw new Error("Idea does not exist!");
        }

        const data = ideaDoc.data();
        const likedBy = data.likedBy || [];
        const isLiked = likedBy.includes(userId);
        
        let newLikedBy;
        let newLikesCount = data.likes || 0;

        if (isLiked) {
          newLikedBy = likedBy.filter((id: string) => id !== userId);
          newLikesCount = Math.max(0, newLikesCount - 1);
        } else {
          newLikedBy = [...likedBy, userId];
          newLikesCount += 1;
        }

        transaction.update(ideaRef, {
          likedBy: newLikedBy,
          likes: newLikesCount
        });

        return { liked: !isLiked, newLikesCount };
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }
};
