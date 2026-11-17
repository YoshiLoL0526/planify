"use client";

import { useState } from "react";

import { DangerTab } from "@/components/sharing/danger-tab";
import { InvitationsTab } from "@/components/sharing/invitations-tab";
import { MembersTab } from "@/components/sharing/members-tab";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";
import type {
  InvitationListItem,
  MemberListItem,
} from "@/server/services/sharing";

type Tab = "members" | "invitations" | "danger";

/** Configuración del proyecto con pestañas (docs/08 · Compartir). */
export function ProjectSettings({
  project,
  members,
  invitations,
  isOwner,
}: {
  project: { id: string; name: string; status: "ACTIVE" | "ARCHIVED" };
  members: MemberListItem[];
  invitations: InvitationListItem[];
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<Tab>("members");

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  ).length;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "members", label: texts.sharing.tabs.members, count: members.length },
    {
      id: "invitations",
      label: texts.sharing.tabs.invitations,
      count: pendingInvitations || undefined,
    },
    { id: "danger", label: texts.sharing.tabs.danger },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1 border-b" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-2.5 py-2 text-[13px] font-medium transition-colors",
              tab === item.id
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {item.label}
            {item.count ? (
              <span className="text-muted-foreground/70 text-[10.5px] tabular-nums">
                {item.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "members" ? (
        <MembersTab
          projectId={project.id}
          members={members}
          isOwner={isOwner}
        />
      ) : null}

      {tab === "invitations" ? (
        isOwner ? (
          <InvitationsTab projectId={project.id} invitations={invitations} />
        ) : (
          <p className="bg-muted/40 text-muted-foreground rounded-xl border px-4 py-3 text-[13px]">
            {texts.sharing.readOnlyNotice}
          </p>
        )
      ) : null}

      {tab === "danger" ? (
        isOwner ? (
          <DangerTab project={project} />
        ) : (
          <p className="bg-muted/40 text-muted-foreground rounded-xl border px-4 py-3 text-[13px]">
            {texts.sharing.readOnlyNotice}
          </p>
        )
      ) : null}
    </div>
  );
}
