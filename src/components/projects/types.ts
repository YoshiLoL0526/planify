import type { ProjectRole } from "@/generated/prisma/enums";

export type Option = { id: string; name: string };

export type ProjectFormTarget = {
  id: string;
  name: string;
  description: string | null;
  folderId: string | null;
  tagIds: string[];
  role: ProjectRole;
};

export type ProjectMenuTarget = ProjectFormTarget & {
  status: "ACTIVE" | "ARCHIVED";
};
