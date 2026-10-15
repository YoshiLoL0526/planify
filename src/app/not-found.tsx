import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { StatusScreen } from "@/components/status-screen";
import { buttonVariants } from "@/components/ui/button";
import { texts } from "@/lib/texts";

export const metadata: Metadata = {
  title: texts.status.notFoundTitle,
};

/** 404 para URLs que no corresponden a ninguna ruta. */
export default function NotFound() {
  return (
    <main className="bg-muted/40 flex min-h-svh flex-col">
      <StatusScreen
        icon={FileQuestionIcon}
        title={texts.status.notFoundTitle}
        description={texts.status.notFoundDescription}
      >
        <Link href="/" className={buttonVariants()}>
          {texts.status.goHome}
        </Link>
      </StatusScreen>
    </main>
  );
}
