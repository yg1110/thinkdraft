import { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/core";
import { useMemoStore } from "../../stores/memoStore";
import { memo } from "../../../wailsjs/go/models";

interface WikiLinkSuggestionProps {
  editor: Editor | null;
}

interface SuggestionState {
  active: boolean;
  query: string;
  from: number;
  to: number;
  coords: { top: number; left: number } | null;
}

export default function WikiLinkSuggestion({ editor }: WikiLinkSuggestionProps) {
  const { memos, createMemo, selectMemo } = useMemoStore();
  const [state, setState] = useState<SuggestionState>({
    active: false,
    query: "",
    from: 0,
    to: 0,
    coords: null,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getFilteredMemos = useCallback(
    (query: string): memo.MemoSummary[] => {
      if (!query.trim()) return memos.slice(0, 10);
      const q = query.toLowerCase();
      return memos
        .filter((m) => (m.title || "Untitled").toLowerCase().includes(q))
        .slice(0, 10);
    },
    [memos]
  );

  const filtered = getFilteredMemos(state.query);
  const showCreateOption =
    state.query.trim().length > 0 &&
    !filtered.some(
      (m) => (m.title || "").toLowerCase() === state.query.toLowerCase()
    );

  const totalItems = filtered.length + (showCreateOption ? 1 : 0);

  // Listen for [[ typing pattern
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { state: editorState } = editor;
      const { from } = editorState.selection;
      const textBefore = editorState.doc.textBetween(
        Math.max(0, from - 100),
        from,
        "\n"
      );

      const match = textBefore.match(/\[\[([^\]]*?)$/);
      if (match) {
        const query = match[1];
        const startPos = from - match[0].length;
        const coords = editor.view.coordsAtPos(from);
        setState({
          active: true,
          query,
          from: startPos,
          to: from,
          coords: { top: coords.bottom + 4, left: coords.left },
        });
        setSelectedIndex(0);
      } else {
        setState((prev) => (prev.active ? { ...prev, active: false } : prev));
      }
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  const insertWikiLink = useCallback(
    (title: string, exists: boolean) => {
      if (!editor) return;

      const { from, to } = state;

      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent({
          type: "wikiLink",
          attrs: { title, exists },
        })
        .run();

      setState({ active: false, query: "", from: 0, to: 0, coords: null });
    },
    [editor, state]
  );

  const handleSelectMemo = useCallback(
    (m: memo.MemoSummary) => {
      insertWikiLink(m.title || "Untitled", true);
    },
    [insertWikiLink]
  );

  const handleCreateNew = useCallback(async () => {
    const title = state.query.trim();
    insertWikiLink(title, false);
    // Create the memo in the background
    await createMemo();
  }, [state.query, insertWikiLink, createMemo]);

  // Keyboard navigation
  useEffect(() => {
    if (!state.active || !editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setState({ active: false, query: "", from: 0, to: 0, coords: null });
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (selectedIndex < filtered.length) {
          handleSelectMemo(filtered[selectedIndex]);
        } else if (showCreateOption) {
          handleCreateNew();
        }
        return;
      }
      // If user types ]], close and insert as-is
      if (e.key === "]") {
        const { state: editorState } = editor;
        const { from } = editorState.selection;
        const charBefore = editorState.doc.textBetween(
          Math.max(0, from - 1),
          from
        );
        if (charBefore === "]" && state.query.trim().length > 0) {
          e.preventDefault();
          e.stopPropagation();
          // Delete the first ] that was just typed and insert the wiki link
          const query = state.query.trim();
          // Remove the trailing ] from query if present
          const cleanQuery = query.endsWith("]") ? query.slice(0, -1) : query;
          const exists = filtered.some(
            (m) =>
              (m.title || "").toLowerCase() === cleanQuery.toLowerCase()
          );
          insertWikiLink(cleanQuery, exists);
        }
      }
    };

    // Use capture phase to intercept before the editor
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [
    state.active,
    editor,
    selectedIndex,
    totalItems,
    filtered,
    showCreateOption,
    handleSelectMemo,
    handleCreateNew,
    insertWikiLink,
    state.query,
  ]);

  // Scroll selected into view
  useEffect(() => {
    if (!dropdownRef.current) return;
    const items = dropdownRef.current.children;
    if (items[selectedIndex]) {
      (items[selectedIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Handle wiki-link clicks in the editor for navigation
  useEffect(() => {
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-wiki-link")) {
        e.preventDefault();
        const title = target.getAttribute("title") || target.textContent;
        if (!title) return;
        // Find the memo by title
        const match = memos.find(
          (m) => (m.title || "").toLowerCase() === title.toLowerCase()
        );
        if (match) {
          selectMemo(match.id);
        }
      }
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener("click", handleClick);
    return () => editorDom.removeEventListener("click", handleClick);
  }, [editor, memos, selectMemo]);

  if (!state.active || !state.coords) return null;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: `${state.coords.top}px`,
        left: `${state.coords.left}px`,
        background: "var(--color-canvas-elevated)",
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--rounded-md)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        maxHeight: "240px",
        width: "280px",
        overflowY: "auto",
        zIndex: 1100,
        padding: "var(--spacing-xxs) 0",
      }}
    >
      {filtered.map((m, index) => (
        <button
          key={m.id}
          onMouseDown={(e) => {
            e.preventDefault();
            handleSelectMemo(m);
          }}
          style={{
            width: "100%",
            display: "block",
            textAlign: "left",
            padding: "var(--spacing-xs) var(--spacing-sm)",
            background:
              index === selectedIndex
                ? "var(--color-primary-muted)"
                : "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-ink)",
            fontSize: "13px",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {m.title || "Untitled"}
        </button>
      ))}
      {showCreateOption && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleCreateNew();
          }}
          style={{
            width: "100%",
            display: "block",
            textAlign: "left",
            padding: "var(--spacing-xs) var(--spacing-sm)",
            background:
              selectedIndex === filtered.length
                ? "var(--color-primary-muted)"
                : "transparent",
            border: "none",
            borderTop:
              filtered.length > 0
                ? "1px solid var(--color-divider)"
                : "none",
            cursor: "pointer",
            color: "var(--color-primary)",
            fontSize: "13px",
            fontWeight: 500,
          }}
          onMouseEnter={() => setSelectedIndex(filtered.length)}
        >
          + Create new memo: &quot;{state.query.trim()}&quot;
        </button>
      )}
      {totalItems === 0 && (
        <div
          style={{
            padding: "var(--spacing-sm)",
            color: "var(--color-ink-tertiary)",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          No memos found
        </div>
      )}
    </div>
  );
}
