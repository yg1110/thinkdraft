import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useMemoStore } from "../../stores/memoStore";
import { useCoachStore } from "../../stores/coachStore";
import { WikiLink } from "./WikiLinkExtension";
import WikiLinkSuggestion from "./WikiLinkSuggestion";
import TagInput from "../Tags/TagInput";
import CoachBanner from "../Coach/CoachBanner";
import SyncIndicator from "../SyncIndicator/SyncIndicator";
import { ResolveWikiLinks } from "../../../wailsjs/go/main/App";

const lowlight = createLowlight(common);

export default function Editor() {
  const { activeMemo, activeId, updateMemo } = useMemoStore();
  const { nudge } = useCoachStore();
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressUpdateRef = useRef(false);

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
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      WikiLink,
    ],
    content: "",
    onUpdate: ({ editor: e }) => {
      if (suppressUpdateRef.current) return;
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
        suppressUpdateRef.current = true;
        editor.commands.setContent(activeMemo.content || "");
        suppressUpdateRef.current = false;
      }
      // Resolve wiki links after setting content
      resolveLinksInEditor(editor, suppressUpdateRef);
    }
    if (editor && !activeMemo) {
      suppressUpdateRef.current = true;
      editor.commands.setContent("");
      suppressUpdateRef.current = false;
    }
  }, [editor, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedUpdate(e.target.value, undefined);
  };

  if (!activeMemo) {
    return (
      <div
        className="flex-1 flex flex-col h-full"
        style={{
          background: "var(--color-canvas)",
          paddingTop: "var(--titlebar-height)",
        }}
      >
        {nudge && <CoachBanner />}
        <div className="flex-1 flex items-center justify-center">
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
      {/* Coach nudge banner */}
      {nudge && <CoachBanner />}

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
        style={{ padding: "var(--spacing-md) var(--spacing-xxl) var(--spacing-md)" }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Tags */}
      {activeId && <TagInput memoID={activeId} />}

      {/* WikiLink suggestion dropdown */}
      <WikiLinkSuggestion editor={editor} />

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
        <SyncIndicator />
      </div>
    </div>
  );
}

/**
 * After loading content, resolve wiki links to check existence and update attrs.
 */
async function resolveLinksInEditor(
  editor: ReturnType<typeof useEditor>,
  suppressUpdateRef: React.MutableRefObject<boolean>,
) {
  if (!editor) return;

  const titles: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === "wikiLink" && node.attrs.title) {
      titles.push(node.attrs.title);
    }
  });

  if (titles.length === 0) return;

  try {
    const resolved = await ResolveWikiLinks(titles);
    if (!resolved || resolved.length === 0) return;

    const resolvedMap = new Map(resolved.map((r) => [r.title, r.exists]));

    // Walk through the doc and update `exists` attribute where needed
    const { tr } = editor.state;
    let modified = false;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "wikiLink" && node.attrs.title) {
        const exists = resolvedMap.get(node.attrs.title);
        if (exists !== undefined && exists !== node.attrs.exists) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            exists,
          });
          modified = true;
        }
      }
    });

    if (modified) {
      suppressUpdateRef.current = true;
      editor.view.dispatch(tr);
      suppressUpdateRef.current = false;
    }
  } catch {
    // Silently ignore resolution failures
  }
}
