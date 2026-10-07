"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { texts } from "@/lib/texts";
import {
  createProjectAction,
  updateProjectAction,
} from "@/server/actions/projects";

import type { Option, ProjectFormTarget } from "./types";

const NO_FOLDER = "__none__";

/**
 * Formulario de proyecto para crear (RF-201) o editar (RF-203, RF-208, RF-209).
 * Se monta condicionalmente desde el padre para reiniciar su estado.
 */
export function ProjectFormDialog({
  mode,
  onOpenChange,
  project,
  folders,
  tags,
}: {
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  project?: ProjectFormTarget;
  folders: Option[];
  tags: Option[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [folderId, setFolderId] = useState(project?.folderId ?? NO_FOLDER);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    project?.tagIds ?? [],
  );

  const canMoveFolder = mode === "create" || project?.role === "OWNER";

  const folderItems = [
    { value: NO_FOLDER, label: texts.projects.form.noFolder },
    ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const payload = {
      name,
      description,
      folderId: folderId === NO_FOLDER ? null : folderId,
      tagIds: selectedTagIds,
    };

    setPending(true);
    const result =
      mode === "create"
        ? await createProjectAction(payload)
        : await updateProjectAction({ projectId: project!.id, ...payload });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onOpenChange(false);

    if (mode === "create") {
      toast.success(texts.projects.created);
      router.push(`/projects/${result.data.projectId}`);
    } else {
      toast.success(texts.projects.updated);
      router.refresh();
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? texts.projects.form.createTitle
              : texts.projects.form.editTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">{texts.projects.form.name}</Label>
            <Input
              id="project-name"
              name="name"
              defaultValue={project?.name ?? ""}
              placeholder={texts.projects.form.namePlaceholder}
              maxLength={120}
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">
              {texts.projects.form.description}
            </Label>
            <Textarea
              id="project-description"
              name="description"
              defaultValue={project?.description ?? ""}
              placeholder={texts.projects.form.descriptionPlaceholder}
              maxLength={2000}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{texts.projects.form.folder}</Label>
            <Select
              items={folderItems}
              value={folderId}
              onValueChange={(value) => setFolderId(value as string)}
              disabled={!canMoveFolder}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {folderItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canMoveFolder ? (
              <p className="text-muted-foreground text-xs">
                {texts.projects.form.folderHintOwner}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{texts.projects.form.tags}</Label>
            {tags.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                {texts.projects.form.noTags}
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={(checked) =>
                        setSelectedTagIds((previous) =>
                          checked
                            ? [...previous, tag.id]
                            : previous.filter((id) => id !== tag.id),
                        )
                      }
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {texts.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {mode === "create"
                ? texts.projects.form.create
                : texts.projects.form.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
