"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BanIcon, CopyIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { RelativeDate } from "@/components/relative-date";
import { CopyLink, copyToClipboard } from "@/components/sharing/copy-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { texts } from "@/lib/texts";
import {
  createInvitationAction,
  regenerateInvitationAction,
  revokeInvitationAction,
} from "@/server/actions/sharing";
import type { InvitationListItem } from "@/server/services/sharing";

const roleItems = [
  { value: "EDITOR", label: texts.roles.EDITOR },
  { value: "VIEWER", label: texts.roles.VIEWER },
];

const expiryItems = [
  { value: "1", label: texts.sharing.invitations.days(1) },
  { value: "7", label: texts.sharing.invitations.days(7) },
  { value: "30", label: texts.sharing.invitations.days(30) },
];

function invitationUrl(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}

const statusVariants = {
  pending: "secondary",
  used: "outline",
  revoked: "outline",
  expired: "outline",
} as const;

/** Pestaña de invitaciones: crear, copiar, regenerar y revocar (RF-802, RF-803). */
export function InvitationsTab({
  projectId,
  invitations,
}: {
  projectId: string;
  invitations: InvitationListItem[];
}) {
  const router = useRouter();
  const [role, setRole] = useState("EDITOR");
  const [days, setDays] = useState("7");
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await createInvitationAction({
      projectId,
      role,
      expiresInDays: Number(days),
    });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const url = invitationUrl(result.data.token);
    setCreatedUrl(url);
    await copyToClipboard(url);
    toast.success(texts.sharing.invitations.created);
    router.refresh();
  }

  async function handleCopy(invitation: InvitationListItem) {
    const ok = await copyToClipboard(invitationUrl(invitation.token));
    if (!ok) {
      toast.error(texts.common.unexpectedError);
      return;
    }
    toast.success(texts.sharing.invitations.copied);
  }

  async function handleRegenerate(invitation: InvitationListItem) {
    setBusyId(invitation.id);
    const result = await regenerateInvitationAction({
      projectId,
      invitationId: invitation.id,
    });
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const url = invitationUrl(result.data.token);
    setCreatedUrl(url);
    await copyToClipboard(url);
    toast.success(texts.sharing.invitations.regenerated);
    router.refresh();
  }

  async function handleRevoke(invitation: InvitationListItem) {
    setBusyId(invitation.id);
    const result = await revokeInvitationAction({
      projectId,
      invitationId: invitation.id,
    });
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(texts.sharing.invitations.revoked);
    router.refresh();
  }

  const pendingList = invitations.filter(
    (invitation) => invitation.status === "pending",
  );
  const history = invitations.filter(
    (invitation) => invitation.status !== "pending",
  );

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleCreate}
        className="bg-card flex flex-col gap-3 rounded-lg border p-4"
      >
        <div>
          <h2 className="font-heading text-base font-medium">
            {texts.sharing.invitations.title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {texts.sharing.invitations.description}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label>{texts.sharing.invitations.role}</Label>
            <Select
              items={roleItems}
              value={role}
              onValueChange={(value) => setRole(value as string)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{texts.sharing.invitations.expiry}</Label>
            <Select
              items={expiryItems}
              value={days}
              onValueChange={(value) => setDays(value as string)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expiryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            {texts.sharing.invitations.create}
          </Button>
        </div>

        {createdUrl ? <CopyLink url={createdUrl} /> : null}
      </form>

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">
          {texts.sharing.invitations.pending}
        </h2>

        {pendingList.length === 0 ? (
          <div className="bg-card rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm font-medium">
              {texts.sharing.invitations.empty}
            </p>
            <p className="text-muted-foreground text-sm">
              {texts.sharing.invitations.emptyDescription}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendingList.map((invitation) => (
              <li
                key={invitation.id}
                className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <Badge variant="outline">{texts.roles[invitation.role]}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {texts.sharing.invitations.expires}{" "}
                    <RelativeDate isoDate={invitation.expiresAt} />
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {texts.sharing.invitations.createdAt}{" "}
                    <RelativeDate isoDate={invitation.createdAt} />
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={texts.sharing.invitations.copy}
                    onClick={() => void handleCopy(invitation)}
                  >
                    <CopyIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={texts.sharing.invitations.regenerate}
                    disabled={busyId === invitation.id}
                    onClick={() => void handleRegenerate(invitation)}
                  >
                    {busyId === invitation.id ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <RefreshCwIcon />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={texts.sharing.invitations.revoke}
                    disabled={busyId === invitation.id}
                    onClick={() => void handleRevoke(invitation)}
                  >
                    <BanIcon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {history.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-medium">
            {texts.sharing.invitations.history}
          </h2>
          <ul className="flex flex-col gap-1.5">
            {history.map((invitation) => (
              <li
                key={invitation.id}
                className="text-muted-foreground flex flex-wrap items-center gap-3 rounded-lg border p-2.5 text-sm"
              >
                <Badge variant={statusVariants[invitation.status]}>
                  {texts.sharing.invitations.status[invitation.status]}
                </Badge>
                <span>{texts.roles[invitation.role]}</span>
                <span className="ml-auto text-xs">
                  {texts.sharing.invitations.createdAt}{" "}
                  <RelativeDate isoDate={invitation.createdAt} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
