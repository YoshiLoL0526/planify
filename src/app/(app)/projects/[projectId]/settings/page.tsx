import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { ProjectSettings } from "@/components/sharing/project-settings";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { AppError } from "@/server/errors";
import { getProjectView } from "@/server/services/projects";
import { listInvitations, listMembers } from "@/server/services/sharing";

/** Compartir: miembros, invitaciones y zona peligrosa (RF-801 a RF-807). */
export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireSession();

  const project = await getProjectView(session.user.id, projectId).catch(
    (error: unknown) => {
      if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
      throw error;
    },
  );

  const isOwner = project.role === "OWNER";

  const [members, invitations] = await Promise.all([
    listMembers(session.user.id, projectId),
    isOwner ? listInvitations(session.user.id, projectId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="text-muted-foreground inline-flex w-fit items-center gap-1 text-sm hover:underline"
        >
          <ArrowLeftIcon className="size-4" />
          {texts.sharing.backToProject}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold">
            {texts.sharing.settingsTitle}
          </h1>
          <Badge variant="secondary">{project.name}</Badge>
          <Badge variant="outline">{texts.roles[project.role]}</Badge>
          {project.status === "ARCHIVED" ? (
            <Badge variant="outline">{texts.projects.archivedBadge}</Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {texts.sharing.settingsSubtitle}
        </p>
      </div>

      <ProjectSettings
        project={{
          id: project.id,
          name: project.name,
          status: project.status,
        }}
        members={members}
        invitations={invitations}
        isOwner={isOwner}
      />
    </div>
  );
}
