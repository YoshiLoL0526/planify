"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { texts } from "@/lib/texts";

import { ProjectFormDialog } from "./project-form-dialog";
import type { Option } from "./types";

export function NewProjectButton({
  folders,
  tags,
  variant = "default",
}: {
  folders: Option[];
  tags: Option[];
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <PlusIcon /> {texts.projects.newProject}
      </Button>

      {open ? (
        <ProjectFormDialog
          mode="create"
          onOpenChange={(isOpen) => !isOpen && setOpen(false)}
          folders={folders}
          tags={tags}
        />
      ) : null}
    </>
  );
}
