import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { StatusScreen } from "@/components/status-screen";
import { buttonVariants } from "@/components/ui/button";
import { texts } from "@/lib/texts";

/** Proyecto o documento inexistente (o sin acceso), dentro del layout de la app. */
export default function AppNotFound() {
  return (
    <StatusScreen
      icon={FileQuestionIcon}
      title={texts.status.notFoundTitle}
      description={texts.status.notFoundDescription}
    >
      <Link href="/" className={buttonVariants()}>
        {texts.status.goHome}
      </Link>
    </StatusScreen>
  );
}
