import { notFound } from "next/navigation";

import { ProjectsPage } from "@/components/projects/projects-page";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { AppError } from "@/server/errors";
import { getTag } from "@/server/services/tags";

export default async function TagPage({
  params,
}: {
  params: Promise<{ tagId: string }>;
}) {
  const { tagId } = await params;
  const session = await requireSession();

  const tag = await getTag(session.user.id, tagId).catch((error: unknown) => {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  return (
    <ProjectsPage
      title={`#${tag.name}`}
      subtitle={texts.tags.title}
      view="active"
      tagId={tag.id}
      emptyTitle={texts.views.tagEmpty}
      emptyDescription={texts.views.tagEmptyDescription}
    />
  );
}
