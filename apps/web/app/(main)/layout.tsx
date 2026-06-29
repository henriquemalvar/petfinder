import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getAuthUser } from "@/lib/api-client";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  return (
    <>
      <Navbar user={user} />
      <main className="min-h-[calc(100vh-5rem)]">{children}</main>
      <Footer />
    </>
  );
}
