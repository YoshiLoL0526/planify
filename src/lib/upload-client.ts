export type UploadedFile = {
  id: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
};

/** Sube un archivo al proyecto (RF-503, RF-504, RF-604). Lanza Error con mensaje en español. */
export async function uploadFile(
  file: File,
  projectId: string,
  kind: "IMAGE" | "ATTACHMENT" | "THUMBNAIL",
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);
  formData.append("kind", kind);

  const response = await fetch("/api/files", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "No se pudo subir el archivo.";
    try {
      const data = (await response.json()) as {
        error?: { message?: string };
      };
      message = data.error?.message ?? message;
    } catch {
      // sin cuerpo JSON: se usa el mensaje genérico
    }
    throw new Error(message);
  }

  return (await response.json()) as UploadedFile;
}
