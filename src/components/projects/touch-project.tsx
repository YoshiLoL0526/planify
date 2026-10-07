"use client";

import { useEffect } from "react";

import { touchProjectAction } from "@/server/actions/projects";

/** Registra la apertura del proyecto para «Recientes» (RF-207). */
export function TouchProject({ projectId }: { projectId: string }) {
  useEffect(() => {
    void touchProjectAction({ projectId });
  }, [projectId]);

  return null;
}
