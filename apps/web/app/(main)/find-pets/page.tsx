import { Suspense } from "react";
import FindPetsPage from "./FindPetsContent";

export default function FindPetsPageWrapper() {
  return (
    <Suspense fallback={<div className="page-container py-8 animate-pulse h-96 bg-muted rounded-2xl" />}>
      <FindPetsPage />
    </Suspense>
  );
}
