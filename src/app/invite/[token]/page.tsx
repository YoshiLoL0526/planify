import type { Metadata } from "next";
import Link from "next/link";
import { CircleXIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { InviteAccept } from "@/components/sharing/invite-accept";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRelative } from "@/lib/dates";
import { getSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { getInvitationByToken } from "@/server/services/sharing";

export const metadata: Metadata = {
  title: texts.sharing.invite.title,
};

/** Aceptar una invitación con o sin sesión (RF-804, RF-805, CU-11). */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSession();
  const preview = await getInvitationByToken(token, session?.user.id);

  const invalidMessage =
    preview.status === "expired"
      ? texts.sharing.invite.expired
      : preview.status === "used"
        ? texts.sharing.invite.used
        : preview.status === "revoked"
          ? texts.sharing.invite.revoked
          : preview.status === "invalid"
            ? texts.sharing.invite.invalid
            : null;

  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className="paper-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-60"
      />

      <Link
        href="/"
        className="focus-visible:ring-ring/30 relative mb-8 flex items-center rounded-md outline-none focus-visible:ring-2"
      >
        <Logo />
      </Link>

      <div className="bg-card relative w-full max-w-lg rounded-xl border p-7 shadow-[0_8px_40px_rgb(20_20_25/0.06)] sm:p-8">
        {invalidMessage ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-card flex size-14 items-center justify-center rounded-xl border">
              <CircleXIcon className="text-destructive size-6" />
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
                {texts.sharing.invite.invalidTitle}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {invalidMessage}
              </p>
              {preview.projectName ? (
                <p className="text-[13px] font-medium">{preview.projectName}</p>
              ) : null}
            </div>
            <Link
              href={session ? "/" : "/login"}
              className={buttonVariants({ variant: "outline" })}
            >
              {texts.sharing.invite.home}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <p className="micro text-primary/75">
                {texts.sharing.invite.title}
              </p>
              <h1 className="font-heading text-[1.9rem] leading-[1.1] font-medium tracking-[-0.025em] text-balance">
                {texts.sharing.invite.toProject(preview.projectName ?? "")}
              </h1>
              {preview.projectDescription ? (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {preview.projectDescription}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {preview.role ? (
                <Badge variant="secondary">
                  {texts.sharing.invite.roleLabel(texts.roles[preview.role])}
                </Badge>
              ) : null}
              {preview.projectArchived ? (
                <Badge variant="outline">{texts.projects.archivedBadge}</Badge>
              ) : null}
              {preview.memberCount !== null ? (
                <Badge variant="outline">
                  {texts.sharing.invite.members(preview.memberCount)}
                </Badge>
              ) : null}
            </div>

            {preview.expiresAt ? (
              <p className="text-muted-foreground border-t pt-4 text-[10.5px] font-medium tracking-[0.08em] uppercase">
                {texts.sharing.invite.expires(
                  formatRelative(preview.expiresAt),
                )}
              </p>
            ) : null}

            {session ? (
              <InviteAccept
                token={token}
                projectId={preview.projectId ?? ""}
                alreadyMember={preview.alreadyMember}
              />
            ) : (
              <div className="flex flex-col gap-2 border-t pt-5">
                <Link
                  href={`/register?next=${encodeURIComponent(`/invite/${token}`)}`}
                  className={buttonVariants({ size: "lg" })}
                >
                  {texts.sharing.invite.registerToJoin}
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  {texts.sharing.invite.loginToJoin}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
