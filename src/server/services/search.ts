import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { parseInput } from "@/server/validators/common";
import {
  searchQuerySchema,
  type SearchStatus,
} from "@/server/validators/search";

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
  /** Documentos dentro de la carpeta (solo resultados de tipo `folder`). */
  documentCount: number | null;
};

/** Resultado de un grupo antes de empaquetarlo (con «hay más» si se truncó). */
type SearchPageItems = {
  items: SearchItem[];
  hasMore: boolean;
};

export type SearchGroupKind =
  "projects" | "notes" | "diagrams" | "tags" | "folders";

export type SearchGroup = {
  kind: SearchGroupKind;
  items: SearchItem[];
  /** Hay más resultados en el grupo de los mostrados (RNF-08 · «Ver más»). */
  hasMore: boolean;
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

type FolderRow = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  status: string;
  documentCount: number;
};

async function searchProjects(
  userId: string,
  terms: string[],
  status: SearchStatus,
  tagId: string | undefined,
  limit: number,
): Promise<SearchPageItems> {
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
    ${tagCondition(tagId)}
    ORDER BY p.updated_at DESC
    LIMIT ${limit + 1}
  `);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      kind: "project" as const,
      title: row.title,
      snippet: row.snippet,
      projectId: null,
      projectName: null,
      archived: row.status === "ARCHIVED",
      updatedAt: row.updatedAt.toISOString(),
      projectCount: null,
      documentCount: null,
    })),
    hasMore,
  };
}

async function searchDocuments(
  userId: string,
  terms: string[],
  type: "NOTE" | "DIAGRAM",
  status: SearchStatus,
  tagId: string | undefined,
  limit: number,
): Promise<SearchPageItems> {
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
    ${tagCondition(tagId)}
    ORDER BY "titleMatch" DESC, d.updated_at DESC
    LIMIT ${limit + 1}
  `);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      kind: (type === "NOTE" ? "note" : "diagram") as SearchItemKind,
      title: row.title,
      snippet: row.snippet,
      projectId: row.projectId,
      projectName: row.projectName,
      archived: row.status === "ARCHIVED",
      updatedAt: row.updatedAt.toISOString(),
      projectCount: null,
      documentCount: null,
    })),
    hasMore,
  };
}

async function searchTags(
  userId: string,
  terms: string[],
  limit: number,
): Promise<SearchPageItems> {
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
    LIMIT ${limit + 1}
  `);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      kind: "tag" as const,
      title: row.title,
      snippet: null,
      projectId: null,
      projectName: null,
      archived: false,
      updatedAt: null,
      projectCount: row.projectCount,
      documentCount: null,
    })),
    hasMore,
  };
}

/**
 * Carpetas de proyecto (RF-301): solo las de proyectos donde el usuario
 * es miembro; el resultado enlaza a la carpeta dentro de su proyecto.
 */
async function searchFolders(
  userId: string,
  terms: string[],
  limit: number,
): Promise<SearchPageItems> {
  const rows = await prisma.$queryRaw<FolderRow[]>(Prisma.sql`
    SELECT
      f.id,
      f.name AS "title",
      p.id AS "projectId",
      p.name AS "projectName",
      p.status::text AS "status",
      (
        SELECT count(*)::int FROM document d WHERE d.folder_id = f.id
      ) AS "documentCount"
    FROM folder f
    JOIN project p ON p.id = f.project_id
    JOIN project_member m ON m.project_id = p.id AND m.user_id = ${userId}
    WHERE ${matchExpr(Prisma.sql`f.name`, terms)}
    ORDER BY f.name ASC
    LIMIT ${limit + 1}
  `);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      kind: "folder" as const,
      title: row.title,
      snippet: null,
      projectId: row.projectId,
      projectName: row.projectName,
      archived: row.status === "ARCHIVED",
      updatedAt: null,
      projectCount: null,
      documentCount: row.documentCount,
    })),
    hasMore,
  };
}

/**
 * Búsqueda global agrupada (RF-303 a RF-306).
 * Ignora acentos y mayúsculas (unaccent + ILIKE) y respeta la membresía.
 */
export async function searchAll(
  userId: string,
  input: unknown,
): Promise<SearchResults> {
  const { q, type, status, tagId, limit } = parseInput(
    searchQuerySchema,
    input,
  );

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

  // Carpetas y etiquetas solo tienen sentido sin filtros de tipo/estado.
  const showOrganizers = type === "all" && status === "all" && !tagId;

  const [projects, notes, diagrams, tags, folders] = await Promise.all([
    type === "note" || type === "diagram"
      ? Promise.resolve<SearchPageItems>({ items: [], hasMore: false })
      : searchProjects(userId, terms, status, tagId, limit),
    type === "project" || type === "diagram"
      ? Promise.resolve<SearchPageItems>({ items: [], hasMore: false })
      : searchDocuments(userId, terms, "NOTE", status, tagId, limit),
    type === "project" || type === "note"
      ? Promise.resolve<SearchPageItems>({ items: [], hasMore: false })
      : searchDocuments(userId, terms, "DIAGRAM", status, tagId, limit),
    showOrganizers
      ? searchTags(userId, terms, limit)
      : Promise.resolve<SearchPageItems>({ items: [], hasMore: false }),
    showOrganizers
      ? searchFolders(userId, terms, limit)
      : Promise.resolve<SearchPageItems>({ items: [], hasMore: false }),
  ]);

  const groups: SearchGroup[] = [
    { kind: "projects", items: projects.items, hasMore: projects.hasMore },
    { kind: "notes", items: notes.items, hasMore: notes.hasMore },
    { kind: "diagrams", items: diagrams.items, hasMore: diagrams.hasMore },
    { kind: "tags", items: tags.items, hasMore: tags.hasMore },
    { kind: "folders", items: folders.items, hasMore: folders.hasMore },
  ].filter((group) => group.items.length > 0) as SearchGroup[];

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return { query: q, total, groups };
}
