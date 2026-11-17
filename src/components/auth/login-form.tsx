"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth-errors";
import { signIn } from "@/lib/auth-client";
import { texts } from "@/lib/texts";
import { safeNextPath } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);

    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div>
      <header className="mb-8">
        <p className="micro text-primary/75 mb-2.5">
          {texts.auth.login.eyebrow}
        </p>
        <h1 className="font-heading text-[2rem] leading-[1.08] font-medium tracking-[-0.03em]">
          {texts.auth.login.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {texts.auth.login.subtitle}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="email"
            className="text-foreground/75 text-[12px] tracking-[0.01em]"
          >
            {texts.auth.login.email}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="password"
            className="text-foreground/75 text-[12px] tracking-[0.01em]"
          >
            {texts.auth.login.password}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          disabled={loading}
        >
          {loading && <Loader2Icon className="animate-spin" />}
          {texts.auth.login.submit}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {texts.auth.login.noAccount}{" "}
          <Link
            href={
              next !== "/"
                ? `/register?next=${encodeURIComponent(next)}`
                : "/register"
            }
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            {texts.auth.login.createAccount}
          </Link>
        </p>
      </form>
    </div>
  );
}
