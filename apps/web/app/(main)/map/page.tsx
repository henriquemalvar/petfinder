import { getPosts } from "@/lib/api-client";
import { withDemoMapPosts } from "@/lib/mock-posts";
import { MapPageClient } from "./MapPageClient";

export default async function MapPage() {
  let posts: Awaited<ReturnType<typeof getPosts>>["posts"] = [];
  try {
    const data = await getPosts({ limit: 50, status: "ACTIVE" });
    posts = data.posts;
  } catch {
    posts = [];
  }

  const { posts: mapPosts, isDemo } = withDemoMapPosts(posts);

  return <MapPageClient initialPosts={mapPosts} isDemo={isDemo} />;
}
