export interface AuditLog {
  id: string;
  action: string;
  targetId: string;
  adminId: string;
  adminName: string;
  timestamp: string;
  details: string;
}

export interface SystemStats {
  totalUsers: number;
  totalIdeas: number;
  totalComments: number;
}
