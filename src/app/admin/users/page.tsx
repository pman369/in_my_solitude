/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Shield, 
  User as UserIcon, 
  MoreHorizontal,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/admin/activity-logger";
import { useUser } from "@/hooks/useUser";
import { Pagination } from "@/components/shared/Pagination";
import { AdminPageHeader } from "@/components/shared/AdminPageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

type Profile = {
  id: string;
  display_name: string | null;
  role: 'reader' | 'sub_admin' | 'admin';
  created_at: string;
  last_active: string | null;
  books_read_count: number;
};

export default function UserManagementPage() {
  const supabase = createClient();
  const { user: currentUser, isAdmin } = useUser();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("user_profiles")
        .select("*", { count: "exact" });

      if (search) {
        query = query.ilike("display_name", `%${search}%`);
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setUsers(data as Profile[] || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function updateRole(userId: string, newRole: 'reader' | 'sub_admin' | 'admin') {
    if (!isAdmin || !currentUser) {
      alert("Only primary admins can change roles.");
      return;
    }

    if (userId === currentUser.id) {
      alert("You cannot change your own administrative rank.");
      return;
    }

    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      const { error } = await (supabase as any)
        .from("user_profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (!error) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        // Log activity
        await logActivity({
          action: "user_role_updated",
          targetType: "user",
          targetId: userId,
          details: { new_role: newRole }
        });
      }
    }
  }

  const roleStyles = {
    admin: { icon: ShieldAlert, bg: 'bg-[#991B1B]/20', border: 'border-[#991B1B]/30', text: 'text-[#F87171]', label: 'Admin' },
    sub_admin: { icon: ShieldCheck, bg: 'bg-[#C9A84C]/20', border: 'border-[#C9A84C]/30', text: 'text-[#C9A84C]', label: 'Sub-Admin' },
    reader: { icon: UserCheck, bg: 'bg-[#1A1A1A]', border: 'border-[#2A2A2A]', text: 'text-[#9A9088]', label: 'Reader' },
  };

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <AdminPageHeader
        title="User"
        highlight="Management"
        subtitle="Oversee the readers and stewards of the archive"
      />

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9088]" />
          <input 
            type="text" 
            placeholder="Search readers by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-[#C9A84C]/40 outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A9088]" />
            <select 
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-9 pr-8 py-2.5 text-xs text-[#9A9088] focus:border-[#C9A84C]/40 outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="sub_admin">Sub-Admins</option>
              <option value="reader">Readers</option>
            </select>
          </div>

          <button 
            onClick={() => { setSearch(""); setRoleFilter("all"); setPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-[#C9A84C] transition-colors text-xs font-bold uppercase tracking-widest"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Reader</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Rank</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333]">Knowledge Level</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <LoadingSpinner message="Summoning the registry..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[#9A9088]">
                    <Users className="w-12 h-12 opacity-10 mx-auto mb-4" />
                    No readers found in this section.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const style = roleStyles[u.role] || roleStyles.reader;
                  return (
                    <tr key={u.id} className="hover:bg-[#1A1A1A]/50 transition-colors group">
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0D0D0D] border border-[#2A2A2A] flex items-center justify-center text-[#9A9088]">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-[#F0EDE6] group-hover:text-[#C9A84C] transition-colors">{u.display_name || "Anonymous Reader"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${style.bg} ${style.border} ${style.text}`}>
                          <style.icon className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{style.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left text-xs text-[#9A9088]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-left text-xs text-[#9A9088]">
                        {u.books_read_count} Volumes Read
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => updateRole(u.id, u.role === 'reader' ? 'sub_admin' : 'reader')}
                             className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-[#C9A84C] transition-colors"
                             title={u.role === 'reader' ? "Promote to Sub-Admin" : "Demote to Reader"}
                           >
                             <Shield className="w-4 h-4" />
                           </button>
                           <Link 
                             href={`/admin/users/${u.id}`}
                             className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] hover:text-[#C9A84C] transition-colors"
                             title="View Profile Details"
                           >
                             <MoreHorizontal className="w-4 h-4" />
                           </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        <Pagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          label={<>Total Readers: <span className="text-[#F0EDE6]">{totalCount}</span></>}
        />
      </div>
    </div>
  );
}
