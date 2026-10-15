import type { Metadata } from "next";

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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {texts.profile.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {texts.profile.subtitle}
        </p>
      </div>

      <ProfileForms
        user={{ name: session.user.name, email: session.user.email }}
      />
    </div>
  );
}
