import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileContent from "./ProfileContent";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export const metadata: Metadata = {
  title: "My Profile",
  description: "Your personal sanctuary — reading shelf, Vault access, requests, and account settings.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/profile");

  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as UserProfile | null;

  return (
    <Suspense>
      <ProfileContent user={user} profile={profile} />
    </Suspense>
  );
}
