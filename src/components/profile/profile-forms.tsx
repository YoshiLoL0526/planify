"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex flex-col gap-6">
      <NameForm user={user} />
      <EmailForm user={user} />
      <PasswordForm />
    </div>
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
    <Card>
      <CardHeader>
        <CardTitle>{texts.profile.name.title}</CardTitle>
        <CardDescription>{texts.profile.name.description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-name">{texts.profile.name.label}</Label>
            <Input
              id="profile-name"
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={user.name}
              key={user.name}
              maxLength={80}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            {texts.profile.name.submit}
          </Button>
        </CardFooter>
      </form>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>{texts.profile.email.title}</CardTitle>
        <CardDescription>{texts.profile.email.description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-email">{texts.profile.email.label}</Label>
            <Input
              id="profile-email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={user.email}
              key={user.email}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            {texts.profile.email.submit}
          </Button>
        </CardFooter>
      </form>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>{texts.profile.password.title}</CardTitle>
        <CardDescription>{texts.profile.password.description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-current-password">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-new-password">
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
            <Label htmlFor="profile-confirm-password">
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
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            {texts.profile.password.submit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
