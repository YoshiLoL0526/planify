import type { Metadata } from "next";

import { SearchView } from "@/components/search/search-view";
import { texts } from "@/lib/texts";
import { requireSession } from "@/lib/session";
import { listFolders } from "@/server/services/folders";
import { listTags } from "@/server/services/tags";
import type { SearchStatus, SearchType } from "@/server/validators/search";

export const metadata: Metadata = {
  title: texts.search.title,
};

const TYPES: readonly SearchType[] = ["all", "project", "note", "diagram"];
const STATUSES: readonly SearchStatus[] = ["all", "active", "archived"];

function pick<T extends string>(
  value: string | string[] | undefined,
  options: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" &&
    (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** Búsqueda global (RF-303 a RF-306). Ruta /search */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const [folders, tags] = await Promise.all([
    listFolders(session.user.id),
    listTags(session.user.id),
  ]);

  const folderId =
    typeof params.folderId === "string" &&
    folders.some((folder) => folder.id === params.folderId)
      ? params.folderId
      : "";
  const tagId =
    typeof params.tagId === "string" &&
    tags.some((tag) => tag.id === params.tagId)
      ? params.tagId
      : "";

  return (
    <div className="flex flex-1 flex-col p-6">
      <SearchView
        folders={folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
        }))}
        tags={tags.map((tag) => ({ id: tag.id, name: tag.name }))}
        initialQuery={typeof params.q === "string" ? params.q : ""}
        initialType={pick(params.type, TYPES, "all")}
        initialStatus={pick(params.status, STATUSES, "all")}
        initialFolderId={folderId}
        initialTagId={tagId}
      />
    </div>
  );
}
