"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function BookmarkCard({ node }: NodeViewProps) {
  const attrs = node.attrs as {
    url: string;
    title: string;
    description: string;
    siteName: string;
    image: string;
  };

  return (
    <NodeViewWrapper data-type="bookmark" className="my-2">
      <a
        href={attrs.url}
        target="_blank"
        rel="noreferrer"
        contentEditable={false}
        className="bg-muted/40 hover:bg-muted flex gap-3 overflow-hidden rounded-lg border p-3 no-underline transition-colors"
      >
        <span className="min-w-0 flex-1">
          <span className="text-muted-foreground block text-xs">
            {attrs.siteName || safeHostname(attrs.url)}
          </span>
          <span className="block truncate text-sm font-medium">
            {attrs.title || attrs.url}
          </span>
          {attrs.description ? (
            <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
              {attrs.description}
            </span>
          ) : null}
        </span>
        {attrs.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attrs.image}
            alt=""
            className="h-16 w-24 shrink-0 rounded object-cover"
          />
        ) : null}
      </a>
    </NodeViewWrapper>
  );
}

/** Tarjeta de enlace con vista previa (RF-505). */
export const Bookmark = Node.create({
  name: "bookmark",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      title: { default: "" },
      description: { default: "" },
      siteName: { default: "" },
      image: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="bookmark"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "bookmark" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkCard);
  },
});
