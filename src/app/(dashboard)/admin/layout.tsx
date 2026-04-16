import { requireServerUser } from "@/lib/server-session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerUser({
    allowedRoles: ["admin"],
    loginPath: "/admin/login",
    unauthorizedRedirect: "/admin/login?error=admin_required",
  });

  return children;
}
