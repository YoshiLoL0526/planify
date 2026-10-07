"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { DownloadIcon, FileIcon } from "lucide-react";

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentCard({ node }: NodeViewProps) {
  const attrs = node.attrs as {
    fileId: string;
    name: string;
    size: number;
  };

  return (
    <NodeViewWrapper data-type="attachment" className="my-2">
      <a
        href={`/api/files/${attrs.fileId}`}
        target="_blank"
        rel="noreferrer"
        contentEditable={false}
        className="bg-muted/40 hover:bg-muted flex items-center gap-3 rounded-lg border p-3 no-underline transition-colors"
      >
        <FileIcon className="text-muted-foreground size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {attrs.name || "Adjunto"}
          </span>
          <span className="text-muted-foreground block text-xs">
            {formatBytes(attrs.size)}
          </span>
        </span>
        <DownloadIcon className="text-muted-foreground size-4 shrink-0" />
      </a>
    </NodeViewWrapper>
  );
}

/** Nodo de adjunto descargable (RF-504). */
export const Attachment = Node.create({
  name: "attachment",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fileId: { default: null },
      name: { default: "" },
      size: { default: 0 },
      mimeType: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="attachment"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "attachment" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentCard);
  },
});
