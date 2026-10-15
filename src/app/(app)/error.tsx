"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { StatusScreen } from "@/components/status-screen";
import { Button, buttonVariants } from "@/components/ui/button";
import { texts } from "@/lib/texts";

/** Error inesperado dentro de la app: mantiene la navegación y permite reintentar. */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      icon={TriangleAlertIcon}
      title={texts.status.errorTitle}
      description={texts.status.errorDescription}
    >
      <Button onClick={() => retry()}>{texts.status.retry}</Button>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        {texts.status.goHome}
      </Link>
      {error.digest ? (
        <p className="text-muted-foreground w-full text-xs">
          {texts.status.errorCode(error.digest)}
        </p>
      ) : null}
    </StatusScreen>
  );
}
