import { useState, useEffect, useRef, useCallback } from "react";
import { useMemoStore } from "../../stores/memoStore";
import { useUIStore } from "../../stores/uiStore";

export default function CommandPalette() {
  const { commandPaletteOpen, toggleCommandPalette } = useUIStore();
  const { memos, selectMemo } = useMemoStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = memos.filter((m) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const title = (m.title || "Untitled").toLowerCase();
    const preview = (m.preview || "").toLowerCase();
    return title.includes(q) || preview.includes(q);
  });

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (id: string) => {
      selectMemo(id);
      toggleCommandPalette();
    },
    [selectMemo, toggleCommandPalette]
  );

  useEffect(() => {
    if (!commandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex].id);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, filtered, selectedIndex, toggleCommandPalette, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    if (items[selectedIndex]) {
      (items[selectedIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      onClick={toggleCommandPalette}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "120px",
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "520px",
          maxHeight: "440px",
          background: "var(--color-canvas-elevated)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--rounded-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Search input */}
        <div
          style={{
            padding: "var(--spacing-sm)",
            borderBottom: "1px solid var(--color-divider)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search memos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

        {/* Results */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--spacing-xxs) 0",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "var(--spacing-lg)",
                textAlign: "center",
                color: "var(--color-ink-tertiary)",
                fontSize: "13px",
              }}
            >
              No memos found
            </div>
          ) : (
            filtered.map((m, index) => (
              <button
                key={m.id}
                onClick={() => handleSelect(m.id)}
                style={{
                  width: "100%",
                  display: "block",
                  textAlign: "left",
                  padding: "var(--spacing-xs) var(--spacing-md)",
                  background:
                    index === selectedIndex
                      ? "var(--color-primary-muted)"
                      : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    color: "var(--color-ink)",
                    fontSize: "14px",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: "2px",
                  }}
                >
                  {m.title || "Untitled"}
                </div>
                <div
                  style={{
                    color: "var(--color-ink-tertiary)",
                    fontSize: "12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.preview || "Empty memo"}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "var(--spacing-xs) var(--spacing-md)",
            borderTop: "1px solid var(--color-divider)",
            display: "flex",
            gap: "var(--spacing-md)",
            color: "var(--color-ink-tertiary)",
            fontSize: "11px",
          }}
        >
          <span>
            <kbd
              style={{
                background: "var(--color-canvas-secondary)",
                borderRadius: "var(--rounded-xs)",
                padding: "1px 4px",
                fontSize: "11px",
              }}
            >
              Up/Down
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd
              style={{
                background: "var(--color-canvas-secondary)",
                borderRadius: "var(--rounded-xs)",
                padding: "1px 4px",
                fontSize: "11px",
              }}
            >
              Enter
            </kbd>{" "}
            open
          </span>
          <span>
            <kbd
              style={{
                background: "var(--color-canvas-secondary)",
                borderRadius: "var(--rounded-xs)",
                padding: "1px 4px",
                fontSize: "11px",
              }}
            >
              Esc
            </kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}
