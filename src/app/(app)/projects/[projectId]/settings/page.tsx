import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
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
    <PageContainer>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[
              { label: texts.nav.home, href: "/" },
              { label: project.name, href: `/projects/${project.id}` },
              { label: texts.sharing.title },
            ]}
          />
          <PageHeader
            eyebrow={project.name}
            title={texts.sharing.settingsTitle}
            description={texts.sharing.settingsSubtitle}
            actions={
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-[0.1em] uppercase">
                  <span
                    aria-hidden
                    className="bg-primary size-1 rounded-full"
                  />
                  {texts.roles[project.role]}
                </span>
                {project.status === "ARCHIVED" ? (
                  <Badge variant="outline">
                    {texts.projects.archivedBadge}
                  </Badge>
                ) : null}
              </div>
            }
          />
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
    </PageContainer>
  );
}
