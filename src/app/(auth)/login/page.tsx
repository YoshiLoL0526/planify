import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { texts } from "@/lib/texts";

export const metadata: Metadata = {
  title: texts.auth.login.title,
};

export default function LoginPage() {
  return <LoginForm />;
}
