import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { parseInput } from "@/server/validators/common";
import {
  searchQuerySchema,
  type SearchStatus,
} from "@/server/validators/search";
import { getFolder } from "@/server/services/folders";

const GROUP_LIMIT = 50;
const MAX_TERMS = 5;
const SNIPPET_CONTEXT = 80;
const SNIPPET_LENGTH = 240;

export type SearchItemKind = "project" | "note" | "diagram" | "tag" | "folder";

export type SearchItem = {
  id: string;
  kind: SearchItemKind;
  title: string;
  snippet: string | null;
  projectId: string | null;
  projectName: string | null;
  archived: boolean;
  updatedAt: string | null;
  projectCount: number | null;
};

export type SearchGroupKind =
  "projects" | "notes" | "diagrams" | "tags" | "folders";

export type SearchGroup = {
  kind: SearchGroupKind;
  items: SearchItem[];
};

export type SearchResults = {
  query: string;
  total: number;
  groups: SearchGroup[];
};

/**
 * Escapa los comodines de `ILIKE` para que el texto del usuario sea literal
 * (la consulta ya va parametrizada; esto solo evita `%` y `_` accidentales).
 */
function likePattern(term: string): string {
  return `%${term.replace(/([\\%_])/g, "\\$1")}%`;
}

/** Todos los términos deben aparecer en la columna (AND de ILIKE sin acentos). */
function matchExpr(column: Prisma.Sql, terms: string[]): Prisma.Sql {
  return Prisma.join(
    terms.map(
      (term) =>
        Prisma.sql`unaccent(${column}) ILIKE unaccent(${likePattern(term)})`,
    ),
    " AND ",
  );
}

/**
 * Cada término debe aparecer en alguna de las columnas (AND de OR), para que
 * «cuna duermete» encuentre el título «Canción de cuna» con ese contenido.
 */
function multiFieldMatchExpr(
  columns: Prisma.Sql[],
  terms: string[],
): Prisma.Sql {
  return Prisma.join(
    terms.map(
      (term) =>
        Prisma.sql`(${Prisma.join(
          columns.map(
            (column) =>
              Prisma.sql`unaccent(${column}) ILIKE unaccent(${likePattern(term)})`,
          ),
          " OR ",
        )})`,
    ),
    " AND ",
  );
}

/** Posición (1-based) del primer término encontrado, o NULL si ninguno. */
function positionExpr(column: Prisma.Sql, terms: string[]): Prisma.Sql {
  const positions = terms.map(
    (term) =>
      Prisma.sql`nullif(position(lower(unaccent(${term})) in lower(unaccent(${column}))), 0)`,
  );
  return Prisma.sql`least(${Prisma.join(positions)})`;
}

/** Fragmento de contexto alrededor de la primera coincidencia (RF-303). */
function snippetExpr(column: Prisma.Sql, terms: string[]): Prisma.Sql {
  const position = positionExpr(column, terms);
  return Prisma.sql`(
    CASE WHEN (${position}) IS NOT NULL THEN
      (CASE WHEN (${position}) > ${SNIPPET_CONTEXT + 1} THEN '…' ELSE '' END)
      || substring(${column} from greatest(1, (${position}) - ${SNIPPET_CONTEXT}) for ${SNIPPET_LENGTH})
      || (CASE WHEN (${position}) + ${SNIPPET_LENGTH - SNIPPET_CONTEXT - 1} < length(${column}) THEN '…' ELSE '' END)
    ELSE NULL END
  )`;
}

/** Condición de estado del proyecto (RF-305). */
function statusCondition(status: SearchStatus, column: Prisma.Sql): Prisma.Sql {
  if (status === "all") return Prisma.empty;
  return Prisma.sql`AND ${column}::text = ${status === "active" ? "ACTIVE" : "ARCHIVED"}`;
}

/** Filtro por carpeta personal (RF-305). */
function folderCondition(folderId: string | undefined): Prisma.Sql {
  if (!folderId) return Prisma.empty;
  return Prisma.sql`AND p.folder_id = ${folderId}`;
}

/** Filtro por etiqueta personal (RF-305). */
function tagCondition(tagId: string | undefined): Prisma.Sql {
  if (!tagId) return Prisma.empty;
  return Prisma.sql`AND EXISTS (
    SELECT 1 FROM project_tag pt WHERE pt.project_id = p.id AND pt.tag_id = ${tagId}
  )`;
}

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
  snippet: string | null;
};

type DocumentRow = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  status: string;
  updatedAt: Date;
  snippet: string | null;
  titleMatch: boolean;
};

type OrganizerRow = {
  id: string;
  title: string;
  projectCount: number;
};

async function searchProjects(
  userId: string,
  terms: string[],
  status: SearchStatus,
  folderId: string | undefined,
  tagId: string | undefined,
): Promise<SearchItem[]> {
  const nameColumn = Prisma.sql`p.name`;
  const descriptionColumn = Prisma.sql`coalesce(p.description, '')`;

  const rows = await prisma.$queryRaw<ProjectRow[]>(Prisma.sql`
    SELECT
      p.id,
      p.name AS "title",
      p.status::text AS "status",
      p.updated_at AS "updatedAt",
      ${snippetExpr(descriptionColumn, terms)} AS "snippet"
    FROM project p
    JOIN project_member m ON m.project_id = p.id AND m.user_id = ${userId}
    WHERE (${multiFieldMatchExpr([nameColumn, descriptionColumn], terms)})
    ${statusCondition(status, Prisma.sql`p.status`)}
    ${folderCondition(folderId)}
    ${tagCondition(tagId)}
    ORDER BY p.updated_at DESC
    LIMIT ${GROUP_LIMIT}
  `);

  return rows.map((row) => ({
    id: row.id,
    kind: "project" as const,
    title: row.title,
    snippet: row.snippet,
    projectId: null,
    projectName: null,
    archived: row.status === "ARCHIVED",
    updatedAt: row.updatedAt.toISOString(),
    projectCount: null,
  }));
}

async function searchDocuments(
  userId: string,
  terms: string[],
  type: "NOTE" | "DIAGRAM",
  status: SearchStatus,
  folderId: string | undefined,
  tagId: string | undefined,
): Promise<SearchItem[]> {
  const titleColumn = Prisma.sql`d.title`;
  const contentColumn = Prisma.sql`coalesce(n.content_text, '')`;
  const titleMatch = matchExpr(titleColumn, terms);

  // Las notas buscan también en su texto extraído (RF-303, RF-506).
  const documentMatch =
    type === "NOTE"
      ? multiFieldMatchExpr([titleColumn, contentColumn], terms)
      : matchExpr(titleColumn, terms);
  const noteJoin =
    type === "NOTE"
      ? Prisma.sql`JOIN note n ON n.document_id = d.id`
      : Prisma.empty;
  const snippet =
    type === "NOTE"
      ? Prisma.sql`${snippetExpr(contentColumn, terms)}`
      : Prisma.sql`NULL::text`;

  const rows = await prisma.$queryRaw<DocumentRow[]>(Prisma.sql`
    SELECT
      d.id,
      d.title AS "title",
      d.project_id AS "projectId",
      p.name AS "projectName",
      p.status::text AS "status",
      d.updated_at AS "updatedAt",
      ${snippet} AS "snippet",
      (${titleMatch}) AS "titleMatch"
    FROM document d
    JOIN project p ON p.id = d.project_id
    JOIN project_member m ON m.project_id = p.id AND m.user_id = ${userId}
    ${noteJoin}
    WHERE d.type::text = ${type}
      AND (${documentMatch})
    ${statusCondition(status, Prisma.sql`p.status`)}
    ${folderCondition(folderId)}
    ${tagCondition(tagId)}
    ORDER BY "titleMatch" DESC, d.updated_at DESC
    LIMIT ${GROUP_LIMIT}
  `);

  return rows.map((row) => ({
    id: row.id,
    kind: (type === "NOTE" ? "note" : "diagram") as SearchItemKind,
    title: row.title,
    snippet: row.snippet,
    projectId: row.projectId,
    projectName: row.projectName,
    archived: row.status === "ARCHIVED",
    updatedAt: row.updatedAt.toISOString(),
    projectCount: null,
  }));
}

async function searchTags(
  userId: string,
  terms: string[],
): Promise<SearchItem[]> {
  const rows = await prisma.$queryRaw<OrganizerRow[]>(Prisma.sql`
    SELECT
      t.id,
      t.name AS "title",
      (
        SELECT count(*)::int FROM project_tag pt
        JOIN project p2 ON p2.id = pt.project_id
        WHERE pt.tag_id = t.id AND p2.status::text = 'ACTIVE'
      ) AS "projectCount"
    FROM tag t
    WHERE t.user_id = ${userId} AND (${matchExpr(Prisma.sql`t.name`, terms)})
    ORDER BY t.name ASC
    LIMIT ${GROUP_LIMIT}
  `);

  return rows.map((row) => ({
    id: row.id,
    kind: "tag" as const,
    title: row.title,
    snippet: null,
    projectId: null,
    projectName: null,
    archived: false,
    updatedAt: null,
    projectCount: row.projectCount,
  }));
}

async function searchFolders(
  userId: string,
  terms: string[],
): Promise<SearchItem[]> {
  const rows = await prisma.$queryRaw<OrganizerRow[]>(Prisma.sql`
    SELECT
      f.id,
      f.name AS "title",
      (
        SELECT count(*)::int FROM project p2
        WHERE p2.folder_id = f.id AND p2.status::text = 'ACTIVE'
      ) AS "projectCount"
    FROM folder f
    WHERE f.user_id = ${userId} AND (${matchExpr(Prisma.sql`f.name`, terms)})
    ORDER BY f.name ASC
    LIMIT ${GROUP_LIMIT}
  `);

  return rows.map((row) => ({
    id: row.id,
    kind: "folder" as const,
    title: row.title,
    snippet: null,
    projectId: null,
    projectName: null,
    archived: false,
    updatedAt: null,
    projectCount: row.projectCount,
  }));
}

/**
 * Búsqueda global agrupada (RF-303 a RF-306).
 * Ignora acentos y mayúsculas (unaccent + ILIKE) y respeta la membresía.
 */
export async function searchAll(
  userId: string,
  input: unknown,
): Promise<SearchResults> {
  const { q, type, status, folderId, tagId } = parseInput(
    searchQuerySchema,
    input,
  );

  if (folderId) {
    await getFolder(userId, folderId);
  }
  if (tagId) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
      select: { id: true },
    });
    if (!tag) {
      throw new AppError("NOT_FOUND", "La etiqueta no existe.");
    }
  }

  const terms = [...new Set(q.split(/\s+/).filter(Boolean))].slice(
    0,
    MAX_TERMS,
  );

  // Carpetas y etiquetas solo tienen sentido sin filtros de tipo/estado/carpeta.
  const showOrganizers =
    type === "all" && status === "all" && !folderId && !tagId;

  const [projects, notes, diagrams, tags, folders] = await Promise.all([
    type === "note" || type === "diagram"
      ? Promise.resolve<SearchItem[]>([])
      : searchProjects(userId, terms, status, folderId, tagId),
    type === "project" || type === "diagram"
      ? Promise.resolve<SearchItem[]>([])
      : searchDocuments(userId, terms, "NOTE", status, folderId, tagId),
    type === "project" || type === "note"
      ? Promise.resolve<SearchItem[]>([])
      : searchDocuments(userId, terms, "DIAGRAM", status, folderId, tagId),
    showOrganizers
      ? searchTags(userId, terms)
      : Promise.resolve<SearchItem[]>([]),
    showOrganizers
      ? searchFolders(userId, terms)
      : Promise.resolve<SearchItem[]>([]),
  ]);

  const groups: SearchGroup[] = [
    { kind: "projects", items: projects },
    { kind: "notes", items: notes },
    { kind: "diagrams", items: diagrams },
    { kind: "tags", items: tags },
    { kind: "folders", items: folders },
  ].filter((group) => group.items.length > 0) as SearchGroup[];

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return { query: q, total, groups };
}
