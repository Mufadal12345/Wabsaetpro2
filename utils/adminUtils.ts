import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { AuditLog } from "../types";

export const logAdminAction = async (
  adminId: string,
  adminName: string,
  actionType: AuditLog["actionType"],
  targetId?: string,
  targetName?: string,
  details?: string
) => {
  try {
    await addDoc(collection(db, "audit_logs"), {
      adminId,
      adminName,
      actionType,
      targetId: targetId || null,
      targetName: targetName || null,
      details: details || null,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
};
