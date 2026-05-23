import { useEffect, useRef } from "react";
import { useMemoStore } from "../../stores/memoStore";

export default function MemoList() {
  const { memos, activeId, searchQuery, loadMemos, search, selectMemo } =
    useMemoStore();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value);
  };

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
    <div
      className="flex flex-col h-full"
      style={{
        width: "var(--memo-list-width)",
        background: "var(--color-canvas-elevated)",
        borderRight: "1px solid var(--color-divider)",
      }}
    >
      {/* Titlebar spacer + Search */}
      <div
        className="titlebar-drag"
        style={{ paddingTop: "var(--titlebar-height)" }}
      >
        <div className="titlebar-no-drag" style={{ padding: "var(--spacing-sm)" }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search memos..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              width: "100%",
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
        </div>
      </div>

      {/* Memo Items */}
      <div className="flex-1 overflow-y-auto">
        {memos.length === 0 ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ color: "var(--color-ink-tertiary)", fontSize: "13px" }}
          >
            {searchQuery ? "No results" : "No memos yet"}
          </div>
        ) : (
          memos.map((memo) => (
            <button
              key={memo.id}
              onClick={() => selectMemo(memo.id)}
              className="titlebar-no-drag w-full text-left cursor-pointer transition-colors"
              style={{
                padding: "var(--spacing-sm) var(--spacing-md)",
                borderBottom: "1px solid var(--color-divider)",
                background:
                  activeId === memo.id
                    ? "var(--color-primary-muted)"
                    : "transparent",
                border: "none",
                borderBlockEnd: "1px solid var(--color-divider)",
                display: "block",
              }}
            >
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
            </button>
          ))
        )}
      </div>
    </div>
  );
}
