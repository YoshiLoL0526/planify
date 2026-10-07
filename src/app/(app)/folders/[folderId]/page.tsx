import { notFound } from "next/navigation";

import { ProjectsPage } from "@/components/projects/projects-page";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { AppError } from "@/server/errors";
import { getFolder } from "@/server/services/folders";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;
  const session = await requireSession();

  const folder = await getFolder(session.user.id, folderId).catch(
    (error: unknown) => {
      if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
      throw error;
    },
  );

  return (
    <ProjectsPage
      title={folder.name}
      subtitle={texts.folders.title}
      view="active"
      folderId={folder.id}
      emptyTitle={texts.views.folderEmpty}
      emptyDescription={texts.views.folderEmptyDescription}
    />
  );
}
