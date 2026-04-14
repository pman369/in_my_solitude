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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

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
  const { user: currentUser } = useUser();
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
    if (!currentUser || currentUser.role !== 'admin') {
      alert("Only primary admins can change roles.");
      return;
    }

    if (userId === currentUser.id) {
      alert("You cannot change your own administrative rank.");
      return;
    }

    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      const { error } = await supabase
        .from("user_profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (!error) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        // Log activity
        await supabase.from("admin_activity_log").insert({
          admin_id: currentUser.id,
          action: "user_role_updated",
          target_type: "user",
          target_id: userId,
          metadata: { new_role: newRole }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#2A2A2A] pb-8">
        <div>
          <h1 className="font-heading text-4xl text-[#F0EDE6]">User <span className="text-[#C9A84C]">Management</span></h1>
          <p className="text-[#9A9088] text-sm mt-1 uppercase tracking-widest font-medium">Oversee the readers and stewards of the archive</p>
        </div>
      </div>

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
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-9 pr-8 py-2.5 text-xs text-[#9A9088] focus:border-[#C9A84C]/40 outline-none appearance-none cursor-pointer"
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
                  <td colSpan={5} className="px-6 py-20 text-center text-[#9A9088]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#C9A84C]" />
                    Summoning the registry...
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
        <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-[#9A9088] font-bold">
            Total Readers: <span className="text-[#F0EDE6]">{totalCount}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] disabled:opacity-20 hover:text-[#C9A84C] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-[#C9A84C] px-2">{page}</span>
            <button 
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg border border-[#2A2A2A] text-[#9A9088] disabled:opacity-20 hover:text-[#C9A84C] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
