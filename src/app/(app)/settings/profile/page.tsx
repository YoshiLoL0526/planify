import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForms } from "@/components/profile/profile-forms";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";

export const metadata: Metadata = {
  title: texts.profile.title,
};

/** Perfil y ajustes de la cuenta (RF-104, RF-1001). Ruta /settings/profile */
export default async function ProfilePage() {
  const session = await requireSession();

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <PageHeader
          title={texts.profile.title}
          description={texts.profile.subtitle}
        />
        <ProfileForms
          user={{ name: session.user.name, email: session.user.email }}
        />
      </div>
    </PageContainer>
  );
}
