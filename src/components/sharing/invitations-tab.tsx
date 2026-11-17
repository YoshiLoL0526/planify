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
        className="bg-card flex flex-col gap-4 rounded-xl border p-5"
      >
        <div>
          <h2 className="font-heading text-[17px] leading-snug font-medium tracking-[-0.01em]">
            {texts.sharing.invitations.title}
          </h2>
          <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
            {texts.sharing.invitations.description}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-foreground/75 text-[12px] tracking-[0.01em]">
              {texts.sharing.invitations.role}
            </Label>
            <Select
              items={roleItems}
              value={role}
              onValueChange={(value) => setRole(value as string)}
            >
              <SelectTrigger
                className="w-36"
                aria-label={texts.sharing.invitations.role}
              >
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
            <Label className="text-foreground/75 text-[12px] tracking-[0.01em]">
              {texts.sharing.invitations.expiry}
            </Label>
            <Select
              items={expiryItems}
              value={days}
              onValueChange={(value) => setDays(value as string)}
            >
              <SelectTrigger
                className="w-36"
                aria-label={texts.sharing.invitations.expiry}
              >
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

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-[1.15rem] font-medium tracking-[-0.015em]">
            {texts.sharing.invitations.pending}
          </h2>
          <span className="micro text-muted-foreground/70">
            {pendingList.length}
          </span>
        </div>

        {pendingList.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed p-8 text-center">
            <p className="text-[13px] font-medium">
              {texts.sharing.invitations.empty}
            </p>
            <p className="text-muted-foreground mt-1 text-[12px]">
              {texts.sharing.invitations.emptyDescription}
            </p>
          </div>
        ) : (
          <ul className="bg-card divide-y overflow-hidden rounded-xl border">
            {pendingList.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5"
              >
                <Badge variant="outline">{texts.roles[invitation.role]}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]">
                    {texts.sharing.invitations.expires}{" "}
                    <RelativeDate isoDate={invitation.expiresAt} />
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[11.5px]">
                    {texts.sharing.invitations.createdAt}{" "}
                    <RelativeDate isoDate={invitation.createdAt} />
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={texts.sharing.invitations.copy}
                    className="text-muted-foreground/70 hover:text-foreground"
                    onClick={() => void handleCopy(invitation)}
                  >
                    <CopyIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={texts.sharing.invitations.regenerate}
                    className="text-muted-foreground/70 hover:text-foreground"
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
                    className="text-muted-foreground/70 hover:text-destructive"
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
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-[1.15rem] font-medium tracking-[-0.015em]">
              {texts.sharing.invitations.history}
            </h2>
            <span className="micro text-muted-foreground/70">
              {history.length}
            </span>
          </div>
          <ul className="bg-card divide-y overflow-hidden rounded-xl border">
            {history.map((invitation) => (
              <li
                key={invitation.id}
                className="text-muted-foreground flex flex-wrap items-center gap-3 px-5 py-2.5 text-[12px]"
              >
                <Badge variant={statusVariants[invitation.status]}>
                  {texts.sharing.invitations.status[invitation.status]}
                </Badge>
                <span>{texts.roles[invitation.role]}</span>
                <span className="ml-auto text-[10.5px] font-medium tracking-[0.08em] uppercase">
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
