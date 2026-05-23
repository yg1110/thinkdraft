import { useUIStore } from "../../stores/uiStore";
import { useMemoStore } from "../../stores/memoStore";

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

export default function Sidebar() {
  const { sidebarView, setSidebarView } = useUIStore();
  const { createMemo } = useMemoStore();

  return (
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
            onClick={() => setSidebarView(item.id)}
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
  );
}
