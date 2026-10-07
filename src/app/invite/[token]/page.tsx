import type { Metadata } from "next";
import Link from "next/link";
import { CircleXIcon } from "lucide-react";

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
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center p-6">
      <div className="bg-card w-full max-w-md rounded-xl border p-6 shadow-sm">
        {invalidMessage ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CircleXIcon className="text-destructive size-8" />
            <h1 className="font-heading text-lg font-semibold">
              {texts.sharing.invite.invalidTitle}
            </h1>
            <p className="text-muted-foreground text-sm">{invalidMessage}</p>
            {preview.projectName ? (
              <p className="text-sm font-medium">{preview.projectName}</p>
            ) : null}
            <Link
              href={session ? "/" : "/login"}
              className={buttonVariants({ variant: "outline" })}
            >
              {texts.sharing.invite.home}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-lg font-semibold">
                {texts.sharing.invite.toProject(preview.projectName ?? "")}
              </h1>
              {preview.projectDescription ? (
                <p className="text-muted-foreground text-sm">
                  {preview.projectDescription}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
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
              <p className="text-muted-foreground text-xs">
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
              <div className="flex flex-col gap-2">
                <Link
                  href={`/register?next=${encodeURIComponent(`/invite/${token}`)}`}
                  className={buttonVariants()}
                >
                  {texts.sharing.invite.registerToJoin}
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
                  className={buttonVariants({ variant: "outline" })}
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
