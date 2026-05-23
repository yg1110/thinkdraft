import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useBlogStore } from "../../stores/blogStore";
import { useUIStore } from "../../stores/uiStore";
import ConfirmModal from "../Modal/ConfirmModal";

const lowlight = createLowlight(common);

const TEMPLATE_LABELS: Record<string, string> = {
  til: "TIL",
  troubleshoot: "Troubleshoot",
  concept: "Concept",
  retrospective: "Retrospective",
};

export default function DraftEditor() {
  const { activeDraft, activeDraftId, updateDraft, deleteDraft, clearActiveDraft } =
    useBlogStore();
  const { setActiveView } = useUIStore();
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const debouncedUpdate = useCallback(
    (title?: string, content?: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateDraft(title, content);
      }, 500);
    },
    [updateDraft]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder: "Start editing your draft...",
      }),
    ],
    content: "",
    onUpdate: ({ editor: e }) => {
      debouncedUpdate(undefined, e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap tiptap-light",
      },
    },
    immediatelyRender: false,
  });

  // Sync editor content when active draft changes
  useEffect(() => {
    if (editor && activeDraft) {
      const currentContent = editor.getHTML();
      if (currentContent !== activeDraft.content) {
        editor.commands.setContent(activeDraft.content || "");
      }
    }
    if (editor && !activeDraft) {
      editor.commands.setContent("");
    }
  }, [editor, activeDraftId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedUpdate(e.target.value, undefined);
  };

  const handleBack = useCallback(() => {
    clearActiveDraft();
    setActiveView("memos");
  }, [clearActiveDraft, setActiveView]);

  const handleDelete = useCallback(() => {
    if (activeDraftId) {
      deleteDraft(activeDraftId);
      setActiveView("memos");
    }
    setDeleteConfirmOpen(false);
  }, [activeDraftId, deleteDraft, setActiveView]);

  if (!activeDraft) {
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
            Select a draft to edit
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{
          background: "var(--color-canvas-light)",
          paddingTop: "var(--titlebar-height)",
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "var(--spacing-xs) var(--spacing-md)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            background: "var(--color-canvas-light)",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              background: "transparent",
              color: "var(--color-ink-on-light)",
              border: "none",
              fontSize: "13px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "var(--rounded-sm)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            &larr; Back to memos
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)" }}>
            {/* Template badge */}
            <span
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                borderRadius: "var(--rounded-pill)",
                padding: "2px 10px",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {TEMPLATE_LABELS[activeDraft.template] || activeDraft.template}
            </span>

            {/* Status badge */}
            <span
              style={{
                background: "rgba(0, 0, 0, 0.06)",
                color: "var(--color-ink-on-light)",
                borderRadius: "var(--rounded-pill)",
                padding: "2px 10px",
                fontSize: "11px",
                fontWeight: 500,
              }}
            >
              Draft
            </span>

            {/* Delete button */}
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              aria-label="Delete draft"
              style={{
                background: "transparent",
                color: "#999",
                border: "none",
                fontSize: "13px",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "var(--rounded-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-ink-danger)";
                e.currentTarget.style.background = "rgba(255, 69, 58, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#999";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: "var(--spacing-xl) var(--spacing-xxl) 0" }}>
          <input
            ref={titleRef}
            type="text"
            placeholder="Untitled Draft"
            defaultValue={activeDraft.title || ""}
            key={activeDraftId}
            onChange={handleTitleChange}
            style={{
              width: "100%",
              background: "transparent",
              color: "var(--color-ink-on-light)",
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
          style={{
            padding: "var(--spacing-md) var(--spacing-xxl) var(--spacing-xxl)",
          }}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-end"
          style={{
            padding: "var(--spacing-xs) var(--spacing-md)",
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            color: "#999",
            fontSize: "12px",
          }}
        >
          <span>Saved locally</span>
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirmOpen}
        message="Delete this draft?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
}
