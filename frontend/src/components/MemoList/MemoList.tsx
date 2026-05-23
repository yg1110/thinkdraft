import { useEffect, useRef, useState, useCallback } from "react";
import { useMemoStore } from "../../stores/memoStore";
import { useUIStore } from "../../stores/uiStore";
import ConfirmModal from "../Modal/ConfirmModal";

interface MemoListProps {
  width: number;
}

export default function MemoList({ width }: MemoListProps) {
  const {
    memos,
    activeId,
    searchQuery,
    loadMemos,
    search,
    selectMemo,
    deleteMemo,
    selectMode,
    selectedIds,
    toggleSelectMode,
    toggleSelectMemo,
  } = useMemoStore();
  const { openTemplateModal } = useUIStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value);
  };

  const handleDeleteClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTarget(id);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMemo(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteMemo]);

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleMemoClick = useCallback(
    (id: string) => {
      if (selectMode) {
        toggleSelectMemo(id);
      } else {
        selectMemo(id);
      }
    },
    [selectMode, toggleSelectMemo, selectMemo]
  );

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
      <div
        className="flex flex-col h-full"
        style={{
          width: `${width}px`,
          minWidth: `${width}px`,
          background: "var(--color-canvas-elevated)",
          borderRight: "1px solid var(--color-divider)",
          position: "relative",
        }}
      >
        {/* Titlebar spacer + Search */}
        <div
          className="titlebar-drag"
          style={{ paddingTop: "var(--titlebar-height)" }}
        >
          <div
            className="titlebar-no-drag"
            style={{
              padding: "var(--spacing-sm)",
              display: "flex",
              gap: "var(--spacing-xs)",
              alignItems: "center",
            }}
          >
            <input
              ref={searchRef}
              type="text"
              placeholder="Search memos..."
              value={searchQuery}
              onChange={handleSearch}
              style={{
                flex: 1,
                background: "var(--color-canvas-input)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-hairline)",
                borderRadius: "var(--rounded-md)",
                padding: "8px 12px",
                fontSize: "15px",
                fontFamily: "var(--font-body)",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-primary)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-hairline)")
              }
            />
            <button
              onClick={toggleSelectMode}
              aria-label={selectMode ? "Exit select mode" : "Enter select mode"}
              title={selectMode ? "Cancel selection" : "Select memos"}
              style={{
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: selectMode
                  ? "var(--color-primary-muted)"
                  : "var(--color-canvas-secondary)",
                color: selectMode
                  ? "var(--color-primary)"
                  : "var(--color-ink-secondary)",
                border: selectMode
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-hairline)",
                borderRadius: "var(--rounded-md)",
                cursor: "pointer",
                fontSize: "14px",
                flexShrink: 0,
                padding: 0,
              }}
            >
              {selectMode ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="2.5"
                    y="2.5"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M5 8L7 10L11 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Memo Items */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: selectMode ? "60px" : "0",
          }}
        >
          {memos.length === 0 ? (
            <div
              className="flex items-center justify-center h-full"
              style={{ color: "var(--color-ink-tertiary)", fontSize: "13px" }}
            >
              {searchQuery ? "No results" : "No memos yet"}
            </div>
          ) : (
            memos.map((memo) => {
              const isSelected = selectedIds.has(memo.id);
              return (
                <div
                  key={memo.id}
                  onMouseEnter={() => setHoveredId(memo.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ position: "relative" }}
                >
                  <button
                    onClick={() => handleMemoClick(memo.id)}
                    className="titlebar-no-drag w-full text-left cursor-pointer transition-colors"
                    style={{
                      padding: "var(--spacing-sm) var(--spacing-md)",
                      background:
                        selectMode && isSelected
                          ? "var(--color-primary-muted)"
                          : activeId === memo.id && !selectMode
                          ? "var(--color-primary-muted)"
                          : "transparent",
                      border: "none",
                      borderBlockEnd: "1px solid var(--color-divider)",
                      display: "flex",
                      width: "100%",
                      gap: "var(--spacing-sm)",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Checkbox in select mode */}
                    {selectMode && (
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "var(--rounded-xs)",
                          border: isSelected
                            ? "none"
                            : "1.5px solid var(--color-ink-tertiary)",
                          background: isSelected
                            ? "var(--color-primary)"
                            : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M3 6L5 8L9 4"
                              stroke="#fff"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    )}

                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div
                        style={{
                          color: "var(--color-ink)",
                          fontSize: "15px",
                          fontWeight: 600,
                          letterSpacing: "-0.374px",
                          lineHeight: 1.24,
                          marginBottom: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          paddingRight: selectMode ? "0" : "24px",
                        }}
                      >
                        {memo.title || "Untitled"}
                      </div>
                      <div
                        style={{
                          color: "var(--color-ink-secondary)",
                          fontSize: "13px",
                          lineHeight: 1.38,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "2px",
                        }}
                      >
                        {memo.preview || "Empty memo"}
                      </div>
                      <div
                        style={{
                          color: "var(--color-ink-tertiary)",
                          fontSize: "13px",
                        }}
                      >
                        {formatDate(memo.updatedAt)}
                      </div>
                    </div>
                  </button>

                  {/* Delete button (visible on hover, hidden in select mode) */}
                  {!selectMode && hoveredId === memo.id && (
                    <button
                      onClick={(e) => handleDeleteClick(e, memo.id)}
                      aria-label={`Delete memo: ${memo.title || "Untitled"}`}
                      className="titlebar-no-drag"
                      style={{
                        position: "absolute",
                        top: "var(--spacing-xs)",
                        right: "var(--spacing-xs)",
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--color-canvas-secondary)",
                        border: "1px solid var(--color-hairline)",
                        borderRadius: "var(--rounded-sm)",
                        color: "var(--color-ink-secondary)",
                        fontSize: "14px",
                        lineHeight: 1,
                        cursor: "pointer",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--color-ink-danger)";
                        e.currentTarget.style.borderColor = "var(--color-ink-danger)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--color-ink-secondary)";
                        e.currentTarget.style.borderColor = "var(--color-hairline)";
                      }}
                    >
                      x
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Floating action bar in select mode */}
        {selectMode && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "var(--color-canvas-elevated)",
              borderTop: "1px solid var(--color-divider)",
              padding: "var(--spacing-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--spacing-xs)",
              zIndex: 10,
            }}
          >
            <span
              style={{
                color: "var(--color-ink-secondary)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => {
                if (selectedIds.size > 0) {
                  openTemplateModal();
                }
              }}
              disabled={selectedIds.size === 0}
              style={{
                background:
                  selectedIds.size > 0
                    ? "var(--color-primary)"
                    : "var(--color-canvas-secondary)",
                color:
                  selectedIds.size > 0 ? "#fff" : "var(--color-ink-tertiary)",
                border: "none",
                borderRadius: "var(--rounded-md)",
                padding: "6px 14px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: selectedIds.size > 0 ? "pointer" : "default",
                opacity: selectedIds.size > 0 ? 1 : 0.6,
              }}
            >
              AI로 정리하기
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        message="Delete this memo?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
