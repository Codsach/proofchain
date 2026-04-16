import { redirect } from "next/navigation";
import LoginForm from "@/app/(auth)/login/login-form";
import { getServerSessionUser } from "@/lib/server-session";

const errorMap = {
  admin_required: "Sign in with an administrator account to access this page.",
} as const;

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

function getSingleSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const user = await getServerSessionUser();
  if (user?.role === "admin") {
    redirect("/admin");
  }

  const params = await searchParams;
  const error = getSingleSearchParam(params.error);

  const statusError =
    error && Object.prototype.hasOwnProperty.call(errorMap, error)
      ? errorMap[error as keyof typeof errorMap]
      : null;

  return <LoginForm statusMessage={null} statusError={statusError} mode="admin" />;
}
