import { AuthHeader } from "@/components/auth/AuthHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthHeader />
      <main className="bg-background min-h-[calc(100vh-5rem)]">{children}</main>
    </>
  );
}
