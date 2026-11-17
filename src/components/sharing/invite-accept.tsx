"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { texts } from "@/lib/texts";
import { acceptInvitationAction } from "@/server/actions/sharing";

/** Aceptar la invitación con sesión iniciada (RF-804, CU-11). */
export function InviteAccept({
  token,
  projectId,
  alreadyMember,
}: {
  token: string;
  projectId: string;
  alreadyMember: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [accepted, setAccepted] = useState(false);

  if (alreadyMember || accepted) {
    return (
      <div className="flex flex-col gap-3 border-t pt-5">
        <p className="text-sm">{texts.sharing.invite.alreadyMember}</p>
        <Link
          href={`/projects/${projectId}`}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          {texts.sharing.invite.goToProject}
          <ArrowRightIcon />
        </Link>
      </div>
    );
  }

  async function handleAccept() {
    setPending(true);
    const result = await acceptInvitationAction({ token });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(texts.sharing.invite.accepted);
    setAccepted(true);
    router.push(`/projects/${result.data.projectId}`);
    router.refresh();
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleAccept}
      disabled={pending}
    >
      {pending && <Loader2Icon className="animate-spin" />}
      {texts.sharing.invite.accept}
    </Button>
  );
}
