import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useMemoStore } from "../../stores/memoStore";

export default function Editor() {
  const { activeMemo, activeId, updateMemo } = useMemoStore();
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdate = useCallback(
    (title?: string, content?: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateMemo(title, content);
      }, 500);
    },
    [updateMemo]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: "",
    onUpdate: ({ editor: e }) => {
      debouncedUpdate(undefined, e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
    immediatelyRender: false,
  });

  // Sync editor content when active memo changes
  useEffect(() => {
    if (editor && activeMemo) {
      const currentContent = editor.getHTML();
      if (currentContent !== activeMemo.content) {
        editor.commands.setContent(activeMemo.content || "");
      }
    }
    if (editor && !activeMemo) {
      editor.commands.setContent("");
    }
  }, [editor, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedUpdate(e.target.value, undefined);
  };

  if (!activeMemo) {
    return (
      <div
        className="flex-1 flex items-center justify-center h-full"
        style={{
          background: "var(--color-canvas)",
          paddingTop: "var(--titlebar-height)",
        }}
      >
        <div className="text-center">
          <div
            style={{
              color: "var(--color-ink-tertiary)",
              fontSize: "15px",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            Select a memo or create a new one
          </div>
          <div
            style={{
              color: "var(--color-ink-tertiary)",
              fontSize: "13px",
            }}
          >
            <kbd
              style={{
                background: "var(--color-canvas-elevated)",
                borderRadius: "var(--rounded-xs)",
                padding: "2px 6px",
                fontSize: "12px",
              }}
            >
              Cmd+N
            </kbd>{" "}
            to create
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{
        background: "var(--color-canvas)",
        paddingTop: "var(--titlebar-height)",
      }}
    >
      {/* Title */}
      <div style={{ padding: "var(--spacing-xl) var(--spacing-xxl) 0" }}>
        <input
          ref={titleRef}
          type="text"
          placeholder="Untitled"
          defaultValue={activeMemo.title || ""}
          key={activeId}
          onChange={handleTitleChange}
          style={{
            width: "100%",
            background: "transparent",
            color: "var(--color-ink)",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            fontWeight: 600,
            lineHeight: 1.18,
            letterSpacing: "-0.22px",
          }}
        />
      </div>

      {/* Editor */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "var(--spacing-md) var(--spacing-xxl) var(--spacing-xxl)" }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-end"
        style={{
          padding: "var(--spacing-xs) var(--spacing-md)",
          borderTop: "1px solid var(--color-divider)",
          color: "var(--color-ink-tertiary)",
          fontSize: "12px",
        }}
      >
        <span>Saved locally</span>
      </div>
    </div>
  );
}
