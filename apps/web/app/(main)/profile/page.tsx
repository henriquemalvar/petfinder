import { redirect } from "next/navigation";
import { getAuthUser, apiFetch } from "@/lib/api-client";
import { ProfileClient } from "./ProfileClient";
import type { PostsResponse } from "@/lib/types";

export default async function ProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?redirect=/profile");

  const { posts } = await apiFetch<PostsResponse>(
    `/api/posts?userId=${user.id}&limit=12`,
  ).catch(() => ({ posts: [], total: 0, page: 1, limit: 12, totalPages: 0 }));

  return <ProfileClient user={user} posts={posts} />;
}
