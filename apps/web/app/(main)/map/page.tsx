import { getPosts } from "@/lib/api-client";
import { MapPageClient } from "./MapPageClient";

export default async function MapPage() {
  let posts: Awaited<ReturnType<typeof getPosts>>["posts"] = [];
  try {
    const data = await getPosts({ limit: 50, status: "ACTIVE" });
    posts = data.posts;
  } catch {
    posts = [];
  }

  return <MapPageClient initialPosts={posts} />;
}
