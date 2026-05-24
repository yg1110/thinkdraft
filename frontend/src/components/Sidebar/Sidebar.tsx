import { useEffect, useCallback, useState } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useMemoStore } from "../../stores/memoStore";
import { useBlogStore } from "../../stores/blogStore";
import { useTagStore } from "../../stores/tagStore";
import ConfirmModal from "../Modal/ConfirmModal";

const NAV_ITEMS = [
  { id: "memos" as const, label: "All Memos", icon: "doc" },
  { id: "tags" as const, label: "Tags", icon: "tag" },
  { id: "drafts" as const, label: "Blog Drafts", icon: "pencil" },
  { id: "coach" as const, label: "AI Coach", icon: "sparkle" },
] as const;

const ICONS: Record<string, string> = {
  doc: "\u{1F4DD}",
  tag: "\u{1F3F7}",
  pencil: "\u{270F}",
  sparkle: "\u{2728}",
  plus: "+",
};

const TEMPLATE_LABELS: Record<string, string> = {
  til: "TIL",
  troubleshoot: "Troubleshoot",
  concept: "Concept",
  retrospective: "Retrospective",
};

export default function Sidebar() {
  const { sidebarView, setSidebarView, setActiveView } = useUIStore();
  const { createMemo, setFilterTag, filterTagId } = useMemoStore();
  const { drafts, loadDrafts, selectDraft, deleteDraft } = useBlogStore();
  const { tags, loadTags } = useTagStore();
  const [hoveredDraftId, setHoveredDraftId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (sidebarView === "drafts") {
      loadDrafts();
    }
    if (sidebarView === "tags") {
      loadTags();
    }
  }, [sidebarView, loadDrafts, loadTags]);

  const handleNavClick = useCallback(
    (id: (typeof NAV_ITEMS)[number]["id"]) => {
      setSidebarView(id);
      if (id === "memos") {
        setActiveView("memos");
        setFilterTag(null);
      } else if (id === "drafts") {
        setActiveView("drafts");
      } else if (id === "tags") {
        setActiveView("memos");
      }
    },
    [setSidebarView, setActiveView, setFilterTag]
  );

  const handleTagClick = useCallback(
    (tagId: string, tagName: string) => {
      if (filterTagId === tagId) {
        setFilterTag(null);
      } else {
        setFilterTag(tagId, tagName);
      }
      setActiveView("memos");
    },
    [filterTagId, setFilterTag, setActiveView]
  );

  const handleDraftClick = useCallback(
    (id: string) => {
      selectDraft(id);
      setActiveView("drafts");
    },
    [selectDraft, setActiveView]
  );

  const handleDeleteDraft = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteTarget(id);
    },
    []
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteDraft(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteDraft]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return d.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <>
      <aside
        className="flex flex-col h-full select-none"
        style={{
          width: "var(--sidebar-width)",
          background: "var(--color-surface-black)",
          paddingTop: "var(--titlebar-height)",
        }}
      >
        {/* Drag region for macOS titlebar */}
        <div className="titlebar-drag h-3" />

        {/* New Memo Button */}
        <div className="px-2 pb-2">
          <button
            onClick={createMemo}
            className="titlebar-no-drag w-full flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-[0.97]"
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              borderRadius: "var(--rounded-md)",
              padding: "8px 18px",
              fontSize: "15px",
              fontWeight: 400,
              border: "none",
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
            New Memo
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 overflow-y-auto">
          <div
            className="uppercase"
            style={{
              color: "var(--color-ink-tertiary)",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "-0.08px",
              padding: "var(--spacing-md) var(--spacing-sm) var(--spacing-xxs)",
            }}
          >
            Navigation
          </div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="titlebar-no-drag w-full flex items-center gap-2 cursor-pointer transition-colors"
              style={{
                background:
                  sidebarView === item.id
                    ? "var(--color-primary-muted)"
                    : "transparent",
                color:
                  sidebarView === item.id
                    ? "var(--color-primary)"
                    : "var(--color-ink-secondary)",
                borderRadius: "var(--rounded-md)",
                padding: "var(--spacing-xs) var(--spacing-sm)",
                height: "32px",
                fontSize: "15px",
                border: "none",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "14px" }}>{ICONS[item.icon]}</span>
              {item.label}
            </button>
          ))}

          {/* Tags List */}
          {sidebarView === "tags" && (
            <div style={{ marginTop: "var(--spacing-xs)" }}>
              <div
                className="uppercase"
                style={{
                  color: "var(--color-ink-tertiary)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  padding:
                    "var(--spacing-sm) var(--spacing-sm) var(--spacing-xxs)",
                }}
              >
                Tags
              </div>
              {tags.length === 0 ? (
                <div
                  style={{
                    color: "var(--color-ink-tertiary)",
                    fontSize: "12px",
                    padding: "var(--spacing-xs) var(--spacing-sm)",
                  }}
                >
                  No tags yet
                </div>
              ) : (
                tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTagClick(t.id, t.name)}
                    className="titlebar-no-drag w-full text-left cursor-pointer"
                    style={{
                      background:
                        filterTagId === t.id
                          ? "var(--color-primary-muted)"
                          : "transparent",
                      border: "none",
                      borderRadius: "var(--rounded-sm)",
                      padding: "var(--spacing-xs) var(--spacing-sm)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      color:
                        filterTagId === t.id
                          ? "var(--color-primary)"
                          : "var(--color-ink-secondary)",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      if (filterTagId !== t.id) {
                        e.currentTarget.style.background =
                          "var(--color-primary-muted)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filterTagId !== t.id) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        background: "var(--color-canvas-secondary)",
                        color: "var(--color-ink-tertiary)",
                        borderRadius: "var(--rounded-pill)",
                        padding: "1px 6px",
                        fontSize: "10px",
                        fontWeight: 500,
                        flexShrink: 0,
                        marginLeft: "var(--spacing-xs)",
                      }}
                    >
                      {t.count}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Blog Drafts List */}
          {sidebarView === "drafts" && (
            <div style={{ marginTop: "var(--spacing-xs)" }}>
              <div
                className="uppercase"
                style={{
                  color: "var(--color-ink-tertiary)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  padding:
                    "var(--spacing-sm) var(--spacing-sm) var(--spacing-xxs)",
                }}
              >
                Drafts
              </div>
              {drafts.length === 0 ? (
                <div
                  style={{
                    color: "var(--color-ink-tertiary)",
                    fontSize: "12px",
                    padding: "var(--spacing-xs) var(--spacing-sm)",
                  }}
                >
                  No drafts yet
                </div>
              ) : (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    onMouseEnter={() => setHoveredDraftId(draft.id)}
                    onMouseLeave={() => setHoveredDraftId(null)}
                    style={{ position: "relative" }}
                  >
                    <button
                      onClick={() => handleDraftClick(draft.id)}
                      className="titlebar-no-drag w-full text-left cursor-pointer"
                      style={{
                        background: "transparent",
                        border: "none",
                        borderRadius: "var(--rounded-sm)",
                        padding:
                          "var(--spacing-xs) var(--spacing-sm)",
                        display: "block",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "var(--color-primary-muted)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          color: "var(--color-ink)",
                          fontSize: "13px",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "2px",
                          paddingRight: "20px",
                        }}
                      >
                        {draft.title || "Untitled Draft"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--spacing-xs)",
                        }}
                      >
                        <span
                          style={{
                            background: "var(--color-canvas-secondary)",
                            color: "var(--color-ink-secondary)",
                            borderRadius: "var(--rounded-pill)",
                            padding: "1px 6px",
                            fontSize: "10px",
                            fontWeight: 500,
                          }}
                        >
                          {TEMPLATE_LABELS[draft.template] || draft.template}
                        </span>
                        <span
                          style={{
                            color: "var(--color-ink-tertiary)",
                            fontSize: "11px",
                          }}
                        >
                          {formatDate(draft.updatedAt)}
                        </span>
                      </div>
                    </button>

                    {hoveredDraftId === draft.id && (
                      <button
                        onClick={(e) => handleDeleteDraft(e, draft.id)}
                        aria-label={`Delete draft: ${draft.title || "Untitled"}`}
                        className="titlebar-no-drag"
                        style={{
                          position: "absolute",
                          top: "var(--spacing-xs)",
                          right: "var(--spacing-xs)",
                          width: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--color-canvas-secondary)",
                          border: "1px solid var(--color-hairline)",
                          borderRadius: "var(--rounded-sm)",
                          color: "var(--color-ink-secondary)",
                          fontSize: "12px",
                          lineHeight: 1,
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color =
                            "var(--color-ink-danger)";
                          e.currentTarget.style.borderColor =
                            "var(--color-ink-danger)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color =
                            "var(--color-ink-secondary)";
                          e.currentTarget.style.borderColor =
                            "var(--color-hairline)";
                        }}
                      >
                        x
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div
          className="px-3 py-3"
          style={{
            borderTop: "1px solid var(--color-divider)",
            color: "var(--color-ink-tertiary)",
            fontSize: "12px",
          }}
        >
          Thinkdraft
        </div>
      </aside>

      <ConfirmModal
        open={deleteTarget !== null}
        message="Delete this draft?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
