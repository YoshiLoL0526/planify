-- Las carpetas pasan de ser personales (por usuario, agrupando proyectos) a
-- pertenecer a un proyecto y agrupar sus documentos (notas y diagramas).
-- Las carpetas antiguas se descartan (decisión de producto): no se convierten.

-- 1. Quitar la relación carpeta -> proyecto
ALTER TABLE "project" DROP CONSTRAINT "project_folder_id_fkey";
DROP INDEX "project_folder_id_idx";
ALTER TABLE "project" DROP COLUMN "folder_id";

-- 2. Recrear la tabla de carpetas con ámbito de proyecto
DROP TABLE "folder";

CREATE TABLE "folder" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- 3. Documentos: carpeta opcional (NULL = raíz del proyecto)
ALTER TABLE "document" ADD COLUMN "folder_id" TEXT;

-- 4. Índices y claves foráneas
CREATE UNIQUE INDEX "folder_project_id_name_key" ON "folder"("project_id", "name");

CREATE INDEX "document_project_id_folder_id_idx" ON "document"("project_id", "folder_id");

ALTER TABLE "folder" ADD CONSTRAINT "folder_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document" ADD CONSTRAINT "document_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
