import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { texts } from "@/lib/texts";

export const metadata: Metadata = {
  title: texts.auth.register.title,
};

export default function RegisterPage() {
  return <RegisterForm />;
}
