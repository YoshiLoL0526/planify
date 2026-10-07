import { ProjectsPage } from "@/components/projects/projects-page";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";

export default async function HomePage() {
  const session = await requireSession();

  return (
    <ProjectsPage
      title={texts.projects.title}
      subtitle={texts.projects.greeting(session.user.name)}
      view="active"
      emptyTitle={texts.projects.emptyTitle}
      emptyDescription={texts.projects.emptyDescription}
    />
  );
}
