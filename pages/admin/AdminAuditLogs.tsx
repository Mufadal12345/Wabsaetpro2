import React from "react";
import { useData } from "../../contexts/DataContext";
import { Icons } from "../../components/Icons";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";

export const AdminAuditLogs: React.FC = () => {
  const { auditLogs, hasMoreAudit, loadingMoreAudit, loadMoreAudit } = useData();

  const loadMoreRef = useIntersectionObserver(() => {
    if (hasMoreAudit && !loadingMoreAudit) {
      loadMoreAudit();
    }
  });

  const getActionIcon = (action: string) => {
    if (action.includes("ban")) return <Icons.Ban className="w-4 h-4 text-red-400" />;
    if (action.includes("admin")) return <Icons.Crown className="w-4 h-4 text-yellow-400" />;
    if (action.includes("delete")) return <Icons.Trash className="w-4 h-4 text-red-400" />;
    if (action.includes("permissions")) return <Icons.Settings className="w-4 h-4 text-purple-400" />;
    return <Icons.Activity className="w-4 h-4 text-blue-400" />;
  };

  const translateAction = (action: string) => {
    switch (action) {
      case "ban_user": return "حظر مستخدم";
      case "unban_user": return "إلغاء حظر مستخدم";
      case "promote_admin": return "ترقية لمشرف";
      case "demote_admin": return "سحب إشراف";
      case "modify_permissions": return "تعديل صلاحيات";
      case "delete_idea": return "حذف فكرة/منشور";
      default: return action;
    }
  };

  return (
    <div className="animate-fade-in font-tajawal pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-amiri gradient-text">
            سجل النشاطات (Audit Logs)
          </h1>
          <p className="text-gray-400">مراقبة إجراءات الإدارة لضمان الشفافية.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-gray-400 text-sm">
              <tr>
                <th className="p-4">الإجراء</th>
                <th className="p-4">المسؤول</th>
                <th className="p-4">الهدف</th>
                <th className="p-4">التفاصيل</th>
                <th className="p-4 w-40">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(auditLogs || []).map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                         {getActionIcon(log.actionType)}
                       </div>
                       <span className="font-bold text-white">{translateAction(log.actionType)}</span>
                    </div>
                  </td>
                  <td className="p-4 cursor-pointer text-blue-400 hover:text-blue-300 transition-colors">
                    {log.adminName}
                  </td>
                  <td className="p-4 cursor-pointer text-pink-400 hover:text-pink-300 transition-colors">
                    {log.targetName || "N/A"}
                  </td>
                  <td className="p-4 text-gray-400 text-sm max-w-xs truncate">
                    {log.details || "-"}
                  </td>
                  <td className="p-4 text-xs text-gray-500 font-mono">
                    {new Date(log.createdAt).toLocaleString("ar-EG")}
                  </td>
                </tr>
              ))}
              {(!auditLogs || auditLogs.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    لا يوجد سجلات نشاط مسجلة في النظام.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center mt-4">
        {loadingMoreAudit && (
          <div className="flex items-center gap-2 text-accent">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold">جاري تحميل المزيد من السجلات...</span>
          </div>
        )}
      </div>
    </div>
  );
};
