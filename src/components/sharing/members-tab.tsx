"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/organization/confirm-dialog";
import { RelativeDate } from "@/components/relative-date";
import { CopyLink } from "@/components/sharing/copy-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/server/actions/sharing";
import type { MemberListItem } from "@/server/services/sharing";

const roleItems = [
  { value: "EDITOR", label: texts.roles.EDITOR },
  { value: "VIEWER", label: texts.roles.VIEWER },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Pestaña de miembros: agregar por email, cambiar rol y quitar (RF-801, RF-806). */
export function MembersTab({
  projectId,
  members,
  isOwner,
}: {
  projectId: string;
  members: MemberListItem[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState("EDITOR");
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberListItem | null>(null);
  const [removing, setRemoving] = useState(false);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "").trim();

    setPending(true);
    const result = await addMemberAction({ projectId, email, role });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    formElement.reset();

    if (result.data.kind === "member") {
      toast.success(texts.sharing.members.added(result.data.name));
      setCreatedLink(null);
      router.refresh();
      return;
    }

    setCreatedLink(
      `${window.location.origin}/invite/${result.data.invitation.token}`,
    );
    toast.info(texts.sharing.members.invitationCreated);
    router.refresh();
  }

  async function handleRoleChange(member: MemberListItem, nextRole: string) {
    const result = await updateMemberRoleAction({
      projectId,
      memberId: member.memberId,
      role: nextRole,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(texts.sharing.members.roleUpdated);
    router.refresh();
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    const result = await removeMemberAction({
      projectId,
      memberId: removeTarget.memberId,
    });
    setRemoving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(texts.sharing.members.removed);
    setRemoveTarget(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {isOwner ? (
        <form
          onSubmit={handleAdd}
          className="bg-card flex flex-col gap-3 rounded-lg border p-4"
        >
          <h2 className="font-heading text-base font-medium">
            {texts.sharing.members.addTitle}
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-60 flex-1 flex-col gap-2">
              <Label htmlFor="member-email">
                {texts.sharing.members.email}
              </Label>
              <Input
                id="member-email"
                name="email"
                type="email"
                required
                placeholder={texts.sharing.members.emailPlaceholder}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{texts.sharing.members.role}</Label>
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
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {texts.sharing.members.submit}
            </Button>
          </div>

          {createdLink ? (
            <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
              <p className="text-sm">
                {texts.sharing.members.invitationCreated}
              </p>
              <CopyLink url={createdLink} />
            </div>
          ) : null}
        </form>
      ) : null}

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">
          {texts.sharing.members.title}
        </h2>
        <ul className="flex flex-col gap-2">
          {members.map((member) => {
            const canManage =
              isOwner && !member.isSelf && member.role !== "OWNER";
            return (
              <li
                key={member.memberId}
                className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <Avatar>
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {member.name}
                    </span>
                    {member.isSelf ? (
                      <Badge variant="secondary">
                        {texts.sharing.members.you}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {member.email ? `${member.email} · ` : ""}
                    {texts.sharing.members.joined}{" "}
                    <RelativeDate isoDate={member.joinedAt} />
                  </p>
                </div>

                {canManage ? (
                  <>
                    <Select
                      items={roleItems}
                      value={member.role}
                      onValueChange={(value) =>
                        void handleRoleChange(member, value as string)
                      }
                    >
                      <SelectTrigger size="sm" className="w-28">
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
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={texts.sharing.members.removeTitle}
                      onClick={() => setRemoveTarget(member)}
                    >
                      <Trash2Icon />
                    </Button>
                  </>
                ) : (
                  <Badge
                    variant={member.role === "OWNER" ? "default" : "outline"}
                  >
                    {texts.roles[member.role]}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {removeTarget ? (
        <ConfirmDialog
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          title={texts.sharing.members.removeTitle}
          description={texts.sharing.members.removeDescription(
            removeTarget.name,
          )}
          confirmLabel={texts.sharing.members.removeConfirm}
          pending={removing}
          onConfirm={handleRemove}
        />
      ) : null}
    </div>
  );
}
