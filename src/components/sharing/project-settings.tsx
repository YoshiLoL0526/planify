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

  const tabs: { id: Tab; label: string }[] = [
    { id: "members", label: texts.sharing.tabs.members },
    { id: "invitations", label: texts.sharing.tabs.invitations },
    { id: "danger", label: texts.sharing.tabs.danger },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {item.label}
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
          <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
            {texts.sharing.readOnlyNotice}
          </p>
        )
      ) : null}

      {tab === "danger" ? (
        isOwner ? (
          <DangerTab project={project} />
        ) : (
          <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
            {texts.sharing.readOnlyNotice}
          </p>
        )
      ) : null}
    </div>
  );
}
