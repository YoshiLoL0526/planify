"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { texts } from "@/lib/texts";
import { createDocumentAction } from "@/server/actions/documents";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // Dentro de editores o diálogos no se disparan los atajos.
  return Boolean(target.closest(".tiptap, .excalidraw, [role='dialog']"));
}

/** Atajos `N` (nota) y `D` (diagrama) dentro de un proyecto (docs/08 · 8.6). */
export function ProjectShortcuts({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pendingRef = useRef(false);

  useEffect(() => {
    async function create(type: "NOTE" | "DIAGRAM") {
      if (pendingRef.current) return;
      pendingRef.current = true;

      const result = await createDocumentAction({ projectId, type });
      pendingRef.current = false;

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        type === "NOTE"
          ? texts.documents.createdNote
          : texts.documents.createdDiagram,
      );
      router.push(`/projects/${projectId}/documents/${result.data.documentId}`);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        void create("NOTE");
      } else if (key === "d") {
        event.preventDefault();
        void create("DIAGRAM");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [projectId, router]);

  return null;
}
