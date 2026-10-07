"use client";

import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  BoldIcon,
  ImageIcon,
  ItalicIcon,
  Link2Icon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PaperclipIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
  UnlinkIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  wide = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  wide?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-foreground flex h-7 items-center justify-center rounded-md outline-none disabled:opacity-40",
        wide ? "px-2 text-xs font-semibold" : "w-7",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <span aria-hidden className="bg-border mx-1 h-5 w-px" />;
}

/** Barra de formato del editor de notas (RF-501 a RF-504). */
export function EditorToolbar({
  editor,
  onUploadImage,
  onUploadAttachment,
}: {
  editor: Editor;
  onUploadImage: (file: File) => void;
  onUploadAttachment: (file: File) => void;
}) {
  const [, forceUpdate] = useReducer((count: number) => count + 1, 0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    const update = () => forceUpdate();
    editor.on("transaction", update);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("transaction", update);
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  function openLinkDialog() {
    const current = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(current ?? "");
    setLinkOpen(true);
  }

  function applyLink() {
    const raw = linkUrl.trim();
    if (!raw) return;
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  }

  const imageWidth = editor.getAttributes("image").width as number | null;

  return (
    <div className="bg-muted/30 flex flex-wrap items-center gap-0.5 border-b p-1.5">
      <ToolbarButton
        label={texts.editor.toolbar.h1}
        wide
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.h2}
        wide
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.h3}
        wide
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        label={texts.editor.toolbar.bold}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.italic}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.underline}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.strike}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        label={texts.editor.toolbar.bulletList}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.orderedList}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.taskList}
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListChecksIcon className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        label={texts.editor.toolbar.quote}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <QuoteIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.hr}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <MinusIcon className="size-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        label={texts.editor.toolbar.link}
        active={editor.isActive("link")}
        onClick={openLinkDialog}
      >
        <Link2Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.image}
        onClick={() => imageInputRef.current?.click()}
      >
        <ImageIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.attachment}
        onClick={() => attachmentInputRef.current?.click()}
      >
        <PaperclipIcon className="size-4" />
      </ToolbarButton>

      {editor.isActive("image") ? (
        <>
          <ToolbarSeparator />
          <span className="text-muted-foreground px-1 text-xs">
            {texts.editor.toolbar.imageWidth}
          </span>
          {[25, 50, 75, 100].map((width) => (
            <ToolbarButton
              key={width}
              label={`${width}%`}
              wide
              active={imageWidth === width}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .updateAttributes("image", { width })
                  .run()
              }
            >
              {width}%
            </ToolbarButton>
          ))}
        </>
      ) : null}

      <ToolbarSeparator />

      <ToolbarButton
        label={texts.editor.toolbar.undo}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={texts.editor.toolbar.redo}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2Icon className="size-4" />
      </ToolbarButton>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUploadImage(file);
          event.target.value = "";
        }}
      />
      <input
        ref={attachmentInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUploadAttachment(file);
          event.target.value = "";
        }}
      />

      {linkOpen ? (
        <Dialog open onOpenChange={(open) => !open && setLinkOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{texts.editor.toolbar.link}</DialogTitle>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                applyLink();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="link-url">{texts.editor.toolbar.linkUrl}</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://…"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLinkOpen(false)}
                >
                  {texts.common.cancel}
                </Button>
                {editor.isActive("link") ? (
                  <Button type="button" variant="outline" onClick={removeLink}>
                    <UnlinkIcon /> {texts.editor.toolbar.linkRemove}
                  </Button>
                ) : null}
                <Button type="submit">{texts.editor.toolbar.linkInsert}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
