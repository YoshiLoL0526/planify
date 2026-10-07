"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFileData,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
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

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((module) => module.Excalidraw),
  { ssr: false },
);

const AUTOSAVE_DELAY_MS = 2000;
const THUMBNAIL_MAX_SIZE = 480;

type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";
type SaveOptions = {
  scene?: LatestScene;
  revisionOverride?: number;
  files?: BinaryFiles;
};

type LatestScene = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
};

type SceneData = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  assets: Record<string, string>;
};

function parseScene(raw: unknown): SceneData {
  if (typeof raw !== "object" || raw === null) {
    return { elements: [], appState: {}, assets: {} };
  }
  const scene = raw as {
    elements?: unknown;
    appState?: unknown;
    assets?: unknown;
  };
  return {
    elements: Array.isArray(scene.elements)
      ? (scene.elements as ExcalidrawElement[])
      : [],
    appState:
      typeof scene.appState === "object" && scene.appState !== null
        ? (scene.appState as Partial<AppState>)
        : {},
    assets:
      typeof scene.assets === "object" && scene.assets !== null
        ? (scene.assets as Record<string, string>)
        : {},
  };
}

/** Subconjunto de appState que se persiste (RF-602). */
function pickAppState(appState: AppState) {
  return {
    viewBackgroundColor: appState.viewBackgroundColor,
    zoom: appState.zoom,
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    gridSize: appState.gridSize ?? null,
  };
}

function viewSignature(appState: Partial<AppState>): string {
  return JSON.stringify({
    viewBackgroundColor: appState.viewBackgroundColor ?? null,
    zoom: appState.zoom ?? null,
    scrollX: appState.scrollX ?? null,
    scrollY: appState.scrollY ?? null,
    gridSize: appState.gridSize ?? null,
  });
}

/**
 * Versión de la escena sin depender del paquete de Excalidraw en el servidor
 * (equivalente a `getSceneVersion`: cambia cuando cambian los elementos).
 */
function sceneVersion(elements: readonly ExcalidrawElement[]): string {
  return elements
    .map((element) => `${element.id}:${element.version}`)
    .join("|");
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function DiagramEditor({
  documentId,
  projectId,
  initialScene,
  initialThumbnailFileId,
  initialRevision,
  canEdit,
}: {
  documentId: string;
  projectId: string;
  initialScene: unknown;
  initialThumbnailFileId: string | null;
  initialRevision: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [conflict, setConflict] = useState<{ currentRevision: number } | null>(
    null,
  );
  const [filesReady, setFilesReady] = useState(false);

  const [initial] = useState<SceneData>(() => parseScene(initialScene));

  const [initialFiles, setInitialFiles] = useState<BinaryFiles>({});

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const revisionRef = useRef(initialRevision);
  const assetsRef = useRef<Record<string, string>>(initial.assets);
  const knownFilesRef = useRef<Set<string>>(
    new Set(Object.keys(initial.assets)),
  );
  const thumbnailRef = useRef<string | null>(initialThumbnailFileId);
  const latestSceneRef = useRef<LatestScene | null>(null);
  const latestFilesRef = useRef<BinaryFiles>({});
  const lastSavedVersionRef = useRef<string>(sceneVersion(initial.elements));
  const lastSavedViewRef = useRef<string>(viewSignature(initial.appState));
  const pendingRef = useRef(false);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const conflictRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<((options?: SaveOptions) => Promise<void>) | null>(
    null,
  );
  const scheduleSaveRef = useRef<(() => void) | null>(null);

  // Rehidrata las imágenes del diagrama como assets (RF-603)
  useEffect(() => {
    let cancelled = false;

    async function loadFiles() {
      const files: BinaryFiles = {};

      await Promise.all(
        Object.entries(initial.assets).map(async ([fileId, assetId]) => {
          try {
            const response = await fetch(`/api/files/${assetId}`);
            if (!response.ok) return;
            const blob = await response.blob();
            const dataURL = await blobToDataURL(blob);
            files[fileId] = {
              id: fileId,
              mimeType: blob.type || "image/png",
              dataURL,
              created: Date.now(),
            } as BinaryFileData;
          } catch {
            // Si un asset no se puede cargar, se omite.
          }
        }),
      );

      if (!cancelled) {
        setInitialFiles(files);
        latestFilesRef.current = files;
        setFilesReady(true);
      }
    }

    void loadFiles();
    return () => {
      cancelled = true;
    };
  }, [initial.assets]);

  /** Sube una imagen pegada/soltada en el diagrama y la mapea a un asset (RF-603). */
  async function uploadDiagramFile(fileId: string, file: BinaryFileData) {
    try {
      const blob = await (await fetch(file.dataURL)).blob();
      const extension = (file.mimeType || "image/png").split("/")[1] ?? "png";
      const upload = new File([blob], `diagrama-${fileId}.${extension}`, {
        type: file.mimeType || "image/png",
      });
      const uploaded = await uploadFile(upload, projectId, "IMAGE");
      assetsRef.current[fileId] = uploaded.id;
      scheduleSaveRef.current?.();
    } catch (error) {
      knownFilesRef.current.delete(fileId);
      toast.error(
        error instanceof Error ? error.message : texts.common.unexpectedError,
      );
    }
  }

  /** Miniatura PNG para la lista de documentos (RF-604). */
  async function generateThumbnail(
    scene: LatestScene,
    files: BinaryFiles,
  ): Promise<string | null> {
    if (typeof window === "undefined") return null;

    const visible = scene.elements.filter((element) => !element.isDeleted);
    if (visible.length === 0) return null;

    const { exportToBlob } = await import("@excalidraw/excalidraw");

    const blob = await exportToBlob({
      elements: visible,
      appState: scene.appState,
      files,
      mimeType: "image/png",
      maxWidthOrHeight: THUMBNAIL_MAX_SIZE,
    });

    const upload = new File([blob], "miniatura.png", { type: "image/png" });
    const uploaded = await uploadFile(upload, projectId, "THUMBNAIL");
    thumbnailRef.current = uploaded.id;
    return uploaded.id;
  }

  const save = async (options?: SaveOptions) => {
    if (!canEdit) return;
    if (conflictRef.current && options?.revisionOverride === undefined) {
      setStatus("conflict");
      return;
    }

    const scene = options?.scene ?? latestSceneRef.current;
    if (!scene) {
      pendingRef.current = false;
      return;
    }

    if (!options?.revisionOverride) {
      const version = sceneVersion(scene.elements);
      const viewSig = viewSignature(scene.appState);
      if (
        version === lastSavedVersionRef.current &&
        viewSig === lastSavedViewRef.current
      ) {
        pendingRef.current = false;
        setStatus("saved");
        return;
      }
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
    const files = options?.files ?? latestFilesRef.current;

    try {
      // Solo regenera la miniatura si cambiaron los elementos o no hay ninguna (RF-604).
      const elementsChanged =
        sceneVersion(scene.elements) !== lastSavedVersionRef.current;
      let thumbnailFileId: string | null = thumbnailRef.current;
      if (elementsChanged || !thumbnailFileId) {
        try {
          thumbnailFileId = await generateThumbnail(scene, files);
        } catch {
          // Sin miniatura nueva: se conserva la anterior.
        }
      }

      const response = await fetch(`/api/documents/${documentId}/content`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          revision: expectedRevision,
          scene: { elements: scene.elements, appState: scene.appState },
          assets: assetsRef.current,
          thumbnailFileId,
        }),
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
      lastSavedVersionRef.current = sceneVersion(scene.elements);
      lastSavedViewRef.current = viewSignature(scene.appState);
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

  useEffect(() => {
    saveRef.current = save;
    scheduleSaveRef.current = scheduleSave;
  });

  function handleChange(
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) {
    const picked = pickAppState(appState);
    latestSceneRef.current = {
      elements,
      appState: picked as Partial<AppState>,
    };
    latestFilesRef.current = files;

    for (const [fileId, file] of Object.entries(files)) {
      if (!knownFilesRef.current.has(fileId)) {
        knownFilesRef.current.add(fileId);
        void uploadDiagramFile(fileId, file);
      }
    }

    // Solo marca cambios relevantes (no selección ni cursor).
    const version = sceneVersion(elements);
    const viewSig = viewSignature(picked as Partial<AppState>);
    if (
      version !== lastSavedVersionRef.current ||
      viewSig !== lastSavedViewRef.current
    ) {
      scheduleSave();
    }
  }

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (pendingRef.current || savingRef.current) {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current && !conflictRef.current) {
        void saveRef.current?.({
          scene: latestSceneRef.current ?? undefined,
          files: latestFilesRef.current,
        });
      }
    };
  }, []);

  function handleReload() {
    conflictRef.current = false;
    setConflict(null);
    router.refresh();
  }

  function handleOverwrite() {
    const currentRevision = conflict?.currentRevision;
    conflictRef.current = false;
    setConflict(null);
    void save({
      revisionOverride: currentRevision,
      scene: latestSceneRef.current ?? undefined,
      files: latestFilesRef.current,
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
    <div className="bg-card flex flex-col gap-0 overflow-hidden rounded-lg border">
      {filesReady ? (
        <div className="h-[70vh] min-h-[480px]">
          <Excalidraw
            excalidrawAPI={(api) => {
              apiRef.current = api;
            }}
            initialData={{
              elements: initial.elements,
              appState: initial.appState,
              files: initialFiles,
              scrollToContent: true,
            }}
            onChange={handleChange}
            langCode="es-ES"
            theme="light"
            viewModeEnabled={!canEdit}
          />
        </div>
      ) : (
        <div className="text-muted-foreground flex h-[70vh] min-h-[480px] items-center justify-center text-sm">
          {texts.diagram.loading}
        </div>
      )}

      <div className="text-muted-foreground flex items-center justify-between gap-2 border-t px-3 py-1.5 text-xs">
        <span>{statusText}</span>
        {canEdit && status === "error" ? (
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() =>
              void save({
                scene: latestSceneRef.current ?? undefined,
                files: latestFilesRef.current,
              })
            }
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
