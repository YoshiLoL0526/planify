"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { texts } from "@/lib/texts";
import { uploadFile } from "@/lib/upload-client";

import { Attachment } from "./attachment-node";
import { Bookmark } from "./bookmark-node";
import { EditorToolbar } from "./editor-toolbar";

const AUTOSAVE_DELAY_MS = 1500;

type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";
type SaveOptions = { contentJson?: unknown; revisionOverride?: number };

/** Imagen con ancho redimensionable en % (RF-503). */
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-width");
          return value ? Number(value) : null;
        },
        renderHTML: (attributes) =>
          attributes.width
            ? {
                "data-width": String(attributes.width),
                style: `width: ${attributes.width}%`,
              }
            : {},
      },
    };
  },
});

export function NoteEditor({
  documentId,
  projectId,
  initialContent,
  initialRevision,
  canEdit,
}: {
  documentId: string;
  projectId: string;
  initialContent: unknown;
  initialRevision: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [conflict, setConflict] = useState<{ currentRevision: number } | null>(
    null,
  );

  const editorRef = useRef<Editor | null>(null);
  const revisionRef = useRef(initialRevision);
  const latestJsonRef = useRef<unknown>(initialContent);
  const pendingRef = useRef(false);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const conflictRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<((options?: SaveOptions) => Promise<void>) | null>(
    null,
  );
  const scheduleSaveRef = useRef<(() => void) | null>(null);

  /** Guardado con control de revisión (RF-406, RF-407). */
  const save = async (options?: SaveOptions) => {
    if (!canEdit) return;
    if (conflictRef.current && options?.revisionOverride === undefined) {
      setStatus("conflict");
      return;
    }

    const editor = editorRef.current;
    const contentJson =
      options?.contentJson ??
      (editor && !editor.isDestroyed ? editor.getJSON() : null);
    if (!contentJson) {
      pendingRef.current = false;
      return;
    }

    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    savingRef.current = true;
    pendingRef.current = false;
    setStatus("saving");

    const expectedRevision = options?.revisionOverride ?? revisionRef.current;

    try {
      const response = await fetch(`/api/documents/${documentId}/content`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ revision: expectedRevision, contentJson }),
      });

      if (response.status === 409) {
        const data = (await response.json().catch(() => null)) as {
          error?: { details?: { currentRevision?: number } };
        } | null;
        conflictRef.current = true;
        setConflict({
          currentRevision:
            data?.error?.details?.currentRevision ?? expectedRevision + 1,
        });
        setStatus("conflict");
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudo guardar.");
      }

      const data = (await response.json()) as { revision: number };
      revisionRef.current = data.revision;
      setStatus("saved");
    } catch {
      pendingRef.current = true;
      setStatus("error");
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        if (!conflictRef.current) void saveRef.current?.();
      }
    }
  };

  const scheduleSave = () => {
    if (!canEdit) return;
    pendingRef.current = true;

    if (conflictRef.current) {
      setStatus("conflict");
      return;
    }

    setStatus((previous) => (previous === "saving" ? previous : "dirty"));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => void saveRef.current?.(),
      AUTOSAVE_DELAY_MS,
    );
  };

  // Mantiene las referencias actualizadas para callbacks estables (editor, cleanup).
  useEffect(() => {
    saveRef.current = save;
    scheduleSaveRef.current = scheduleSave;
  });

  async function insertUploadedFile(file: File, kind: "IMAGE" | "ATTACHMENT") {
    const editor = editorRef.current;
    if (!editor) return;

    const toastId = toast.loading(
      kind === "IMAGE"
        ? texts.editor.uploadingImage
        : texts.editor.uploadingAttachment,
    );

    try {
      const uploaded = await uploadFile(file, projectId, kind);
      if (kind === "IMAGE") {
        editor
          .chain()
          .focus()
          .setImage({ src: uploaded.url, alt: uploaded.originalName })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "attachment",
            attrs: {
              fileId: uploaded.id,
              name: uploaded.originalName,
              size: uploaded.sizeBytes,
              mimeType: uploaded.mimeType,
            },
          })
          .run();
      }
      toast.success(texts.editor.uploaded, { id: toastId });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : texts.common.unexpectedError,
        { id: toastId },
      );
    }
  }

  async function insertBookmark(url: string) {
    const editor = editorRef.current;
    if (!editor) return;

    const toastId = toast.loading(texts.editor.loadingPreview);

    try {
      const response = await fetch(
        `/api/link-preview?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) throw new Error("preview failed");

      const data = (await response.json()) as {
        url: string;
        title: string | null;
        description: string | null;
        siteName: string | null;
        image: string | null;
      };

      editor
        .chain()
        .focus()
        .insertContent({
          type: "bookmark",
          attrs: {
            url: data.url,
            title: data.title ?? "",
            description: data.description ?? "",
            siteName: data.siteName ?? "",
            image: data.image ?? "",
          },
        })
        .run();
      toast.dismiss(toastId);
    } catch {
      // Fallback: enlace simple (RF-505)
      editor.chain().focus().insertContent(url).run();
      toast.error(texts.editor.previewFailed, { id: toastId });
    }
  }

  function handlePaste(view: EditorView, event: ClipboardEvent): boolean {
    const clipboard = event.clipboardData;
    if (!clipboard || !canEdit) return false;

    // Imágenes pegadas desde el portapapeles (RF-503)
    const imageFiles = Array.from(clipboard.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (imageFiles.length > 0) {
      event.preventDefault();
      for (const file of imageFiles) void insertUploadedFile(file, "IMAGE");
      return true;
    }

    // URL suelta en un párrafo vacío → tarjeta de vista previa (RF-505)
    const text = clipboard.getData("text/plain").trim();
    if (/^https?:\/\/\S+$/i.test(text)) {
      const { selection } = view.state;
      const isEmptyParagraph =
        selection.empty &&
        selection.$from.parent.type.name === "paragraph" &&
        selection.$from.parent.content.size === 0;
      if (isEmptyParagraph) {
        event.preventDefault();
        void insertBookmark(text);
        return true;
      }
    }

    return false;
  }

  const editor = useEditor({
    editable: canEdit,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer nofollow",
            target: "_blank",
          },
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: texts.editor.placeholder }),
      Attachment,
      Bookmark,
    ],
    content:
      (initialContent as JSONContent | null) ??
      ({ type: "doc", content: [{ type: "paragraph" }] } satisfies JSONContent),
    editorProps: {
      attributes: { class: "tiptap-content focus:outline-none" },
      handlePaste,
    },
    onUpdate: ({ editor: currentEditor }) => {
      latestJsonRef.current = currentEditor.getJSON();
      scheduleSaveRef.current?.();
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Aviso al cerrar la pestaña con cambios sin guardar (RF-406)
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (pendingRef.current || savingRef.current) {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Ctrl/⌘+S: guardado inmediato (docs/08 · 8.6)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        const current = editorRef.current;
        void saveRef.current?.({
          contentJson:
            current && !current.isDestroyed
              ? current.getJSON()
              : latestJsonRef.current,
        });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Intento de guardado al desmontar (cambio de página)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current && !conflictRef.current) {
        void saveRef.current?.({ contentJson: latestJsonRef.current });
      }
    };
  }, []);

  function handleReload() {
    conflictRef.current = false;
    setConflict(null);
    // El padre remonta el editor con el contenido del servidor.
    router.refresh();
  }

  function handleOverwrite() {
    const currentRevision = conflict?.currentRevision;
    conflictRef.current = false;
    setConflict(null);
    void save({
      revisionOverride: currentRevision,
      contentJson: latestJsonRef.current ?? editorRef.current?.getJSON(),
    });
  }

  const statusText = canEdit
    ? {
        saved: texts.editor.saved,
        dirty: texts.editor.dirty,
        saving: texts.editor.saving,
        error: texts.editor.saveError,
        conflict: texts.editor.conflictStatus,
      }[status]
    : texts.editor.readOnly;

  return (
    <div className="bg-card flex flex-col overflow-hidden rounded-lg border">
      {canEdit && editor ? (
        <EditorToolbar
          editor={editor}
          onUploadImage={(file) => void insertUploadedFile(file, "IMAGE")}
          onUploadAttachment={(file) =>
            void insertUploadedFile(file, "ATTACHMENT")
          }
        />
      ) : null}

      <EditorContent editor={editor} />

      <div className="text-muted-foreground flex items-center justify-between gap-2 border-t px-3 py-1.5 text-xs">
        <span>{statusText}</span>
        {canEdit && status === "error" ? (
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => void save()}
          >
            {texts.editor.retry}
          </button>
        ) : null}
      </div>

      {conflict ? (
        <Dialog open onOpenChange={() => {}}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{texts.editor.conflictTitle}</DialogTitle>
              <DialogDescription>
                {texts.editor.conflictDescription}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleReload}>
                {texts.editor.conflictReload}
              </Button>
              <Button onClick={handleOverwrite}>
                {texts.editor.conflictOverwrite}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
