"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { texts } from "@/lib/texts";

const SHORTCUTS: { keys: string; label: string; context?: string }[] = [
  { keys: "Ctrl/⌘ + K", label: texts.shortcuts.search },
  { keys: "Ctrl/⌘ + S", label: texts.shortcuts.save },
  { keys: "Esc", label: texts.shortcuts.close },
  {
    keys: "N",
    label: texts.shortcuts.newNote,
    context: texts.shortcuts.inProject,
  },
  {
    keys: "D",
    label: texts.shortcuts.newDiagram,
    context: texts.shortcuts.inProject,
  },
  { keys: "Ctrl/⌘ + Enter", label: texts.shortcuts.sendComment },
];

/** Ayuda de atajos accesible desde el menú de usuario (RNF-03). */
export function ShortcutsDialog({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{texts.shortcuts.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {texts.shortcuts.title}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.keys}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>
                {shortcut.label}
                {shortcut.context ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {shortcut.context}
                  </span>
                ) : null}
              </span>
              <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-sans text-xs font-medium whitespace-nowrap">
                {shortcut.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
