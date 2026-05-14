import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  QueryConstraint,
  getCountFromServer,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../../../firebase';
import { FirestoreService, handleFirestoreError, OperationType } from '../../../services/firebase/firebase.service';
import { UserProfile, UserRole } from '../../auth/types/auth.types';
import { AuditLog, SystemStats } from '../types/admin.types';

export const AdminService = {
  async logAdminAction(adminId: string, adminName: string, action: string, targetId: string, details: string): Promise<void> {
    const log: Omit<AuditLog, 'id'> = {
      action,
      targetId,
      adminId,
      adminName,
      timestamp: new Date().toISOString(),
      details,
    };
    await FirestoreService.addDocument('audit_logs', log);
  },

  async getAllUsers(pageParam: QueryDocumentSnapshot<DocumentData> | null, pageSize: number = 20) {
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    if (pageParam) {
      constraints.push(startAfter(pageParam));
    }
    
    try {
      const colRef = collection(db, "users");
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as UserProfile[];

      return {
        users,
        lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.QUERY, "users");
    }
  },

  async updateUserRole(admin: UserProfile, targetUserId: string, newRole: UserRole): Promise<void> {
    if (admin.role !== 'admin' && admin.role !== 'super_admin') {
      throw new Error("Unauthorized to change roles");
    }
    
    const targetRef = doc(db, 'users', targetUserId);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) throw new Error("User not found");
    
    const targetUser = targetSnap.data() as UserProfile;
    
    if (targetUser.role === 'super_admin' && admin.role !== 'super_admin') {
      throw new Error("Admin cannot change role of a super_admin");
    }

    await updateDoc(targetRef, { role: newRole });
    await this.logAdminAction(admin.id, admin.name, 'UPDATE_ROLE', targetUserId, `Role changed from ${targetUser.role} to ${newRole}`);
  },

  async banUser(admin: UserProfile, targetUserId: string, isBanned: boolean, banReason?: string): Promise<void> {
    if (admin.role !== 'admin' && admin.role !== 'super_admin') {
      throw new Error("Unauthorized");
    }

    const targetRef = doc(db, 'users', targetUserId);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) throw new Error("User not found");
    
    const targetUser = targetSnap.data() as UserProfile;

    if (targetUser.role === 'super_admin' && admin.role !== 'super_admin') {
      throw new Error("Admin cannot ban a super_admin");
    }

    await updateDoc(targetRef, { isBanned, banReason: banReason || null });
    await this.logAdminAction(
        admin.id, 
        admin.name, 
        isBanned ? 'BAN_USER' : 'UNBAN_USER', 
        targetUserId, 
        isBanned ? `Reason: ${banReason}` : 'Ban removed'
    );
  },

  async deleteIdeaByAdmin(admin: UserProfile, ideaId: string): Promise<void> {
      if (admin.role !== 'admin' && admin.role !== 'super_admin') {
          throw new Error("Unauthorized");
      }
      await FirestoreService.deleteDocument('ideas', ideaId);
      await this.logAdminAction(admin.id, admin.name, 'DELETE_IDEA', ideaId, 'Deleted idea as admin');
  },

  async getSystemStats(): Promise<SystemStats> {
      try {
          const [usersSnap, ideasSnap, commentsSnap] = await Promise.all([
            getCountFromServer(collection(db, 'users')),
            getCountFromServer(collection(db, 'ideas')),
            getCountFromServer(collection(db, 'comments'))
          ]);
          
          return {
              totalUsers: usersSnap.data().count,
              totalIdeas: ideasSnap.data().count,
              totalComments: commentsSnap.data().count,
          };
      } catch(error) {
          console.error("Error getting system stats", error);
          return { totalUsers: 0, totalIdeas: 0, totalComments: 0 };
      }
  }
};
