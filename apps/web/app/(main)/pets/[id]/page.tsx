import { notFound } from "next/navigation";
import { getComments, getPost } from "@/lib/api-client";
import { PetDetailClient } from "./PetDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PetDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const [post, comments] = await Promise.all([
      getPost(id),
      getComments(id).catch(() => []),
    ]);
    return <PetDetailClient post={post} initialComments={comments} />;
  } catch {
    notFound();
  }
}
