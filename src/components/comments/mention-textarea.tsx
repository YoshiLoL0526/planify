"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MemberOption = { id: string; name: string };

/** Composer con sugerencias de `@miembros` (RF-704). */
export function MentionTextarea({
  value,
  onChange,
  members,
  placeholder,
  onSubmit,
  rows = 2,
  autoFocus = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  members: MemberOption[];
  placeholder?: string;
  /** Con Ctrl/⌘+Enter. */
  onSubmit?: () => void;
  rows?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions =
    mentionQuery === null
      ? []
      : members
          .filter((member) =>
            member.name.toLowerCase().includes(mentionQuery.toLowerCase()),
          )
          .slice(0, 6);

  function updateMentionState(nextValue: string, caret: number) {
    const before = nextValue.slice(0, caret);
    const match = /@([\p{L}\p{N}._-]*)$/u.exec(before);
    if (match) {
      setMentionQuery(match[1]);
      setActiveIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(member: MemberOption) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const caret = textarea.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const match = /@([\p{L}\p{N}._-]*)$/u.exec(before);
    const start = match ? caret - match[0].length : caret;
    const next = `${value.slice(0, start)}@${member.name} ${value.slice(caret)}`;

    onChange(next);
    setMentionQuery(null);

    const nextCaret = start + member.name.length + 2;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(
          (index) => (index - 1 + suggestions.length) % suggestions.length,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertMention(suggestions[activeIndex]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          updateMentionState(
            event.target.value,
            event.target.selectionStart ?? event.target.value.length,
          );
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Deja tiempo a que el clic en una sugerencia se procese.
          setTimeout(() => setMentionQuery(null), 150);
        }}
        className="min-h-0 resize-none"
      />

      {mentionQuery !== null && suggestions.length > 0 ? (
        <ul className="bg-popover absolute bottom-full left-0 z-20 mb-1 max-h-40 w-56 overflow-y-auto rounded-lg border p-1 shadow-md">
          {suggestions.map((member, index) => (
            <li key={member.id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertMention(member)}
                className={cn(
                  "flex w-full rounded-md px-2 py-1.5 text-left text-sm",
                  index === activeIndex ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                {member.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
