"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth-errors";
import {
  authClient,
  changeEmail,
  changePassword,
  updateUser,
} from "@/lib/auth-client";
import { isCommonPassword } from "@/lib/password-policy";
import { texts } from "@/lib/texts";

type SessionUser = { name: string; email: string };

/** Perfil y contraseña (RF-104, RF-1001). */
export function ProfileForms({ user }: { user: SessionUser }) {
  return (
    <div className="bg-card divide-y overflow-hidden rounded-xl border">
      <NameForm user={user} />
      <EmailForm user={user} />
      <PasswordForm />
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="px-6 py-6 sm:px-8">
      <div className="max-w-xl">
        <h2 className="font-heading text-[17px] leading-snug font-medium tracking-[-0.01em]">
          {title}
        </h2>
        <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
          {description}
        </p>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

function NameForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();

    if (name === user.name) {
      toast.info(texts.profile.name.same);
      return;
    }

    setLoading(true);
    const { error } = await updateUser({ name });
    setLoading(false);

    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }

    toast.success(texts.profile.name.saved);
    router.refresh();
  }

  return (
    <FormSection
      title={texts.profile.name.title}
      description={texts.profile.name.description}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="profile-name"
          name="name"
          type="text"
          aria-label={texts.profile.name.label}
          autoComplete="name"
          defaultValue={user.name}
          key={user.name}
          maxLength={80}
          required
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            {texts.profile.name.submit}
          </Button>
        </div>
      </form>
    </FormSection>
  );
}

function EmailForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newEmail = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();

    if (newEmail === user.email.toLowerCase()) {
      toast.info(texts.profile.email.same);
      return;
    }

    setLoading(true);
    const { error } = await changeEmail({ newEmail });
    if (error) {
      setLoading(false);
      toast.error(authErrorMessage(error));
      return;
    }

    // better-auth no distingue si el email ya estaba en uso: la sesión
    // solo cambia cuando el nuevo email se aplicó de verdad.
    const { data } = await authClient.getSession();
    setLoading(false);

    if (data?.user.email.toLowerCase() === newEmail) {
      toast.success(texts.profile.email.saved);
      router.refresh();
    } else {
      toast.error(texts.profile.email.taken);
    }
  }

  return (
    <FormSection
      title={texts.profile.email.title}
      description={texts.profile.email.description}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="profile-email"
          name="email"
          type="email"
          aria-label={texts.profile.email.label}
          autoComplete="email"
          defaultValue={user.email}
          key={user.email}
          required
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            {texts.profile.email.submit}
          </Button>
        </div>
      </form>
    </FormSection>
  );
}

function PasswordForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      toast.error(texts.profile.password.mismatch);
      return;
    }
    if (isCommonPassword(newPassword)) {
      toast.error(texts.auth.weakPassword);
      return;
    }

    setLoading(true);
    const { error } = await changePassword({ currentPassword, newPassword });
    setLoading(false);

    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }

    formElement.reset();
    toast.success(texts.profile.password.saved);
  }

  return (
    <FormSection
      title={texts.profile.password.title}
      description={texts.profile.password.description}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="profile-current-password"
            className="text-foreground/75 text-[12px] tracking-[0.01em]"
          >
            {texts.profile.password.current}
          </Label>
          <Input
            id="profile-current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="profile-new-password"
              className="text-foreground/75 text-[12px] tracking-[0.01em]"
            >
              {texts.profile.password.next}
            </Label>
            <Input
              id="profile-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="profile-confirm-password"
              className="text-foreground/75 text-[12px] tracking-[0.01em]"
            >
              {texts.profile.password.confirm}
            </Label>
            <Input
              id="profile-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            {texts.profile.password.submit}
          </Button>
        </div>
      </form>
    </FormSection>
  );
}
