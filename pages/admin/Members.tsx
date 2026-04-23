import React, { useState } from "react";
import { useData } from "../../contexts/DataContext";
import { updateDoc, doc, addDoc, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { Icons } from "../../components/Icons";
import { useToast } from "../../contexts/ToastContext";
import { User } from "../../types";
import { Modal } from "./Modal";
import { useAuth } from "../../contexts/AuthContext";
import { logAdminAction } from "../../utils/adminUtils";
import { TableRowSkeleton } from "../../components/Skeletons";
import { useQueryClient } from "@tanstack/react-query";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";

const AVAILABLE_PERMISSIONS = [
  { id: "view_members", label: "رؤية قائمة الأعضاء" },
  { id: "ban_members", label: "حظر وفك حظر الأعضاء" },
  { id: "message_members", label: "مراسلة الأعضاء" },
  { id: "manage_admins", label: "إدارة صلاحيات المديرين" },
  { id: "manage_suggestions", label: "إدارة الاقتراحات والشكاوى" },
  { id: "manage_ideas", label: "إدارة الأفكار والمنشورات" },
  { id: "manage_philosophy", label: "إدارة رواق الفلسفة" },
  { id: "manage_skills", label: "إدارة تطوير المهارات" },
  { id: "manage_quotes", label: "إدارة العبارات الملهمة" },
  { id: "manage_notifications", label: "إدارة التنبيهات العامة" },
  { id: "manage_sections", label: "إدارة أقسام الموقع" },
];

export const Members: React.FC = () => {
  const queryClient = useQueryClient();
  const { users, hasMoreUsers, loadingMoreUsers, loadMoreUsers, loadingData } = useData();
  
  const loadMoreRef = useIntersectionObserver(() => {
    if (hasMoreUsers && !loadingMoreUsers) {
      loadMoreUsers();
    }
  });
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "admins">("members");
  const [authFilter, setAuthFilter] = useState<"all" | "google" | "email">("all");
  
  // Message Modal State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");

  // Permissions Modal State
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);

  // User Action Modal State
  const [isUserActionModalOpen, setIsUserActionModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  
  // Ban Modal State
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banDuration, setBanDuration] = useState("permanent");

  const handleUserClick = (user: User) => {
    setTargetUser(user);
    setIsUserActionModalOpen(true);
  };

  const filteredUsers = users.filter(
    (user) => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "members" ? user.role === "user" : user.role !== "user";
      
      let matchesAuth = true;
      if (authFilter === "google") {
        matchesAuth = user.authMethod === "google.com";
      } else if (authFilter === "email") {
        matchesAuth = user.authMethod === "password" || user.authMethod === "email" || !user.authMethod;
      }

      return matchesSearch && matchesTab && matchesAuth;
    }
  );

  const handleBanSubmit = async () => {
    if (!targetUser) return;
    if (targetUser.role === "admin" || targetUser.role === "super_admin") {
      showToast("لا يمكن حظر المشرفين", "error");
      return;
    }

    try {
      let banUntil: Date | string | null = null;
      if (banDuration !== "permanent") {
        const hours = parseInt(banDuration);
        const date = new Date();
        date.setHours(date.getHours() + hours);
        banUntil = date; // Pass as native Date so Firestore stores as Timestamp
      }

      await updateDoc(doc(db, "users", targetUser.id), {
        isBanned: true,
        banUntil, // Now saving as a native Firestore Timestamp
        banReason: banReason || null
      });

      if (currentUser) {
        await logAdminAction(currentUser.id, currentUser.name, "ban_user", targetUser.id, targetUser.name, `حظر لمدة: ${banDuration}, السبب: ${banReason}`);
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("تم حظر المستخدم بنجاح", "success");
      setIsBanModalOpen(false);
      setBanReason("");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("حدث خطأ أثناء تحديث حالة الحظر", "error");
    }
  };

  const handleUnban = async (user: User) => {
    try {
      await updateDoc(doc(db, "users", user.id), {
        isBanned: false,
        banUntil: null,
        banReason: null
      });

      if (currentUser) {
        await logAdminAction(currentUser.id, currentUser.name, "unban_user", user.id, user.name);
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("تم فك حظر المستخدم بنجاح", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("حدث خطأ أثناء فك الحظر", "error");
    }
  };

  const promoteToAdmin = async (user: User) => {
    if (user.role === "admin" || user.role === "super_admin") return;
    try {
      await updateDoc(doc(db, "users", user.id), {
        role: "admin",
        specialty: "مدير النظام",
        adminPermissions: ["view_members"] // Default permission
      });
      if (currentUser) {
        await logAdminAction(currentUser.id, currentUser.name, "promote_admin", user.id, user.name);
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast(`تمت ترقية ${user.name} إلى مشرف بنجاح`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("حدث خطأ أثناء ترقية المستخدم", "error");
    }
  };

  const demoteAdmin = async (user: User) => {
    if (user.role !== "admin") return;
    try {
      await updateDoc(doc(db, "users", user.id), {
        role: "user",
        specialty: "مستخدم",
        adminPermissions: []
      });
      if (currentUser) {
        await logAdminAction(currentUser.id, currentUser.name, "demote_admin", user.id, user.name);
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast(`تم سحب الصلاحيات من ${user.name} بنجاح`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("حدث خطأ أثناء سحب الصلاحيات", "error");
    }
  };

  const openMessageModal = (user: User) => {
    setSelectedUser(user);
    setMessageTitle("");
    setMessageContent("");
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageTitle.trim() || !messageContent.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, "messages"), {
        title: messageTitle,
        content: messageContent,
        type: "private",
        from: currentUser.name,
        fromId: currentUser.id,
        toUserId: selectedUser.id,
        status: "sent",
        read: false,
        createdAt: new Date().toISOString(),
      });
      showToast("تم إرسال الرسالة بنجاح", "success");
      setIsMessageModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "messages");
      showToast("فشل إرسال الرسالة", "error");
    }
  };

  const openPermissionsModal = (admin: User) => {
    setSelectedAdmin(admin);
    setAdminPermissions(admin.adminPermissions || []);
    setIsPermissionsModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setAdminPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin || !currentUser) return;

    try {
      await updateDoc(doc(db, "users", selectedAdmin.id), {
        adminPermissions: adminPermissions,
      });
      await logAdminAction(currentUser.id, currentUser.name, "modify_permissions", selectedAdmin.id, selectedAdmin.name, `New perms: ${adminPermissions.join(', ')}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast("تم تحديث صلاحيات المشرف بنجاح", "success");
      setIsPermissionsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("فشل تحديث الصلاحيات", "error");
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-amiri gradient-text">
            إدارة الأعضاء
          </h1>
          <p className="text-gray-400">قائمة المستخدمين والتحكم في صلاحياتهم</p>
        </div>
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="بحث عن عضو..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-style pl-10 pr-4 py-2 rounded-xl w-full md:w-64"
          />
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "members" ? "bg-accent text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            الأعضاء ({users.filter(u => u.role === "user").length})
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "admins" ? "bg-accent text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            المدراء ({users.filter(u => u.role !== "user").length})
          </button>
        </div>
        
        {/* Auth Provider Filter */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setAuthFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              authFilter === "all" ? "bg-white/20 text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setAuthFilter("google")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              authFilter === "google" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            <i className="fab fa-google"></i> جوجل
          </button>
          <button
            onClick={() => setAuthFilter("email")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              authFilter === "email" ? "bg-accent text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            <i className="fas fa-envelope"></i> البريد
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-gray-400 text-sm">
              <tr>
                <th className="p-4">العضو</th>
                <th className="p-4">الدور</th>
                <th className="p-4">تاريخ الانضمام</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingData ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center font-bold">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        user.role === "super_admin" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        user.role === "admin" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : 
                        "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {user.role === "super_admin" ? "مدير رئيسي" : user.role === "admin" ? "مشرف" : "عضو"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`flex items-center gap-1 text-xs ${user.isBanned ? "text-red-400" : "text-green-400"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${user.isBanned ? "bg-red-500" : "bg-green-500"}`}
                      ></span>
                      {user.isBanned ? "محظور" : "نشط"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user.isBanned) {
                            handleUnban(user);
                          } else {
                            setTargetUser(user);
                            setIsBanModalOpen(true);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${user.isBanned ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
                        title={user.isBanned ? "فك الحظر" : "حظر المستخدم"}
                      >
                        {user.isBanned ? (
                          <Icons.Check className="w-4 h-4" />
                        ) : (
                          <Icons.Ban className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMessageModal(user);
                        }}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="مراسلة على الخاص"
                      >
                        <Icons.Message className="w-4 h-4" />
                      </button>
                      {user.role === "user" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            promoteToAdmin(user);
                          }}
                          className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                          title="ترقية إلى مشرف"
                        >
                          <Icons.Crown className="w-4 h-4" />
                        </button>
                      )}
                      {user.role === "admin" && currentUser?.role === "super_admin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            demoteAdmin(user);
                          }}
                          className="p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                          title="سحب الصلاحيات"
                        >
                          <Icons.User className="w-4 h-4" />
                        </button>
                      )}
                      {user.role === "admin" && user.id !== currentUser?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPermissionsModal(user);
                          }}
                          className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                          title="تعديل الصلاحيات"
                        >
                          <Icons.Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        {!loadingData && filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد نتائج مطابقة
          </div>
        )}

        <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center bg-white/5 border-t border-white/5">
          {loadingMoreUsers && (
            <div className="flex items-center gap-2 text-accent">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold">جاري تحميل المزيد من الأعضاء...</span>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isUserActionModalOpen}
        onClose={() => setIsUserActionModalOpen(false)}
        title={`إدارة العضو: ${targetUser?.name}`}
      >
        <div className="space-y-6 font-tajawal pb-6">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-indigo-500 flex items-center justify-center text-2xl font-bold">
              {targetUser?.name[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{targetUser?.name}</h3>
              <p className="text-sm text-gray-400">{targetUser?.email}</p>
              <span className="text-[10px] px-2 py-0.5 bg-accent/20 text-accent rounded-full border border-accent/30 uppercase mt-1 inline-block">
                {targetUser?.role === "super_admin" ? "مدير رئيسي" : targetUser?.role === "admin" ? "مشرف" : "عضو"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {targetUser?.role === "user" && (
              <button
                onClick={() => {
                  promoteToAdmin(targetUser);
                  setIsUserActionModalOpen(false);
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <Icons.Crown className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">ترقية إلى مشرف</p>
                    <p className="text-xs text-gray-400">منح صلاحيات إدارية للمستخدم</p>
                  </div>
                </div>
                <Icons.ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-yellow-500 transition-colors" />
              </button>
            )}

            {targetUser?.role === "admin" && (
              <button
                onClick={() => {
                  openPermissionsModal(targetUser);
                  setIsUserActionModalOpen(false);
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500">
                    <Icons.Settings className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">تعديل الصلاحيات</p>
                    <p className="text-xs text-gray-400">تحديد المهام الموكلة للمشرف</p>
                  </div>
                </div>
                <Icons.ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-purple-500 transition-colors" />
              </button>
            )}

            {targetUser?.role === "admin" && currentUser?.role === "super_admin" && (
              <button
                onClick={() => {
                  demoteAdmin(targetUser);
                  setIsUserActionModalOpen(false);
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <Icons.User className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">إلغاء الإشراف</p>
                    <p className="text-xs text-gray-400">إرجاع المستخدم إلى عضو عادي</p>
                  </div>
                </div>
                <Icons.ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
              </button>
            )}

            <button
              onClick={() => {
                openMessageModal(targetUser!);
                setIsUserActionModalOpen(false);
              }}
              className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Icons.Message className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">إرسال رسالة خاصة</p>
                  <p className="text-xs text-gray-400">التواصل المباشر مع العضو</p>
                </div>
              </div>
              <Icons.ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
            </button>

            <button
              onClick={() => {
                if (targetUser?.isBanned) {
                  handleUnban(targetUser!);
                } else {
                  setIsBanModalOpen(true);
                }
                setIsUserActionModalOpen(false);
              }}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${
                targetUser?.isBanned 
                  ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/20" 
                  : "bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  targetUser?.isBanned ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                }`}>
                  {targetUser?.isBanned ? <Icons.Check className="w-5 h-5" /> : <Icons.Ban className="w-5 h-5" />}
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{targetUser?.isBanned ? "فك الحظر" : "حظر العضو"}</p>
                  <p className="text-xs text-gray-400">
                    {targetUser?.isBanned ? "السماح للعضو بالدخول مرة أخرى" : "منع العضو من الوصول للنظام"}
                  </p>
                </div>
              </div>
              <Icons.ChevronLeft className={`w-5 h-5 text-gray-600 transition-colors ${
                targetUser?.isBanned ? "group-hover:text-green-500" : "group-hover:text-red-500"
              }`} />
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        title={`حظر المستخدم: ${targetUser?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">مدة الحظر</label>
            <select
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              className="input-style w-full px-4 py-3 rounded-xl font-bold bg-[#0a0f1f]"
            >
              <option value="24">يوم واحد (24 ساعة)</option>
              <option value="168">أسبوع (7 أيام)</option>
              <option value="720">شهر (30 يوم)</option>
              <option value="permanent">حظر دائم</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">السبب (اختياري)</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="اكتب سبب الحظر..."
              className="input-style w-full px-4 py-3 rounded-xl h-24 resize-none"
            />
          </div>
          <button
            onClick={handleBanSubmit}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all"
          >
            تأكيد الحظر
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title={`مراسلة ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">عنوان الرسالة</label>
            <input
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              type="text"
              placeholder="الموضوع..."
              className="input-style w-full px-4 py-3 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">محتوى الرسالة</label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="input-style w-full px-4 py-3 rounded-xl h-32 resize-none"
            />
          </div>
          <button
            onClick={handleSendMessage}
            className="btn-primary w-full py-3 rounded-xl font-bold"
          >
            إرسال الرسالة 📤
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title={`صلاحيات المشرف: ${selectedAdmin?.name}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {AVAILABLE_PERMISSIONS.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={adminPermissions.includes(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                  className="w-5 h-5 rounded border-gray-600 text-accent focus:ring-accent bg-transparent"
                />
                <span className="text-gray-200">{permission.label}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleSavePermissions}
            className="btn-primary w-full py-3 rounded-xl font-bold mt-4"
          >
            حفظ الصلاحيات
          </button>
        </div>
      </Modal>
    </div>
  );
};
