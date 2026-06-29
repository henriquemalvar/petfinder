import Image from "next/image";
import Link from "next/link";
import type { ApiPost } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { StatusChip } from "./StatusChip";
import { Card } from "@/components/ui/card";

interface PetCardProps {
  post: ApiPost;
  variant?: "default" | "compact";
}

export function PetCard({ post, variant = "default" }: PetCardProps) {
  const image = post.pet.image || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop";

  return (
    <Link href={`/pets/${post.id}`}>
      <Card className="group overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={image}
            alt={post.pet.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
          />
          <div className="absolute inset-x-0 bottom-0 pet-card-image-gradient p-4">
            <StatusChip type={post.type} pulse={post.type === "LOST"} />
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">{post.pet.name}</h3>
              <p className="text-sm text-muted-foreground">
                {post.pet.breed} · {post.pet.age}
              </p>
            </div>
            {variant === "default" && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo(post.createdAt)}
              </span>
            )}
          </div>
          {post.pet.location && (
            <p className="mt-2 text-xs text-muted-foreground">{post.pet.location}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
