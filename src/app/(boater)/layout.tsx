import { getSession } from "@/lib/auth";
import { BoaterNavbar } from "@/components/layouts/boater-navbar";

export default async function BoaterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <BoaterNavbar
        userName={session.name || "Boater"}
        userEmail={session.email || ""}
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
