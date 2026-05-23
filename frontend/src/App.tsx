import { useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import MemoList from "./components/MemoList/MemoList";
import Editor from "./components/Editor/Editor";
import DraftEditor from "./components/BlogDraft/DraftEditor";
import TemplateModal from "./components/BlogDraft/TemplateModal";
import ResizeHandle from "./components/ResizeHandle/ResizeHandle";
import CommandPalette from "./components/CommandPalette/CommandPalette";
import { useUIStore } from "./stores/uiStore";
import { useMemoStore } from "./stores/memoStore";

export default function App() {
  const {
    sidebarOpen,
    toggleSidebar,
    memoListWidth,
    setMemoListWidth,
    toggleCommandPalette,
    setSidebarCollapsed,
    activeView,
  } = useUIStore();
  const { createMemo, selectPrevMemo, selectNextMemo } = useMemoStore();
  const prevSidebarOpenRef = useRef(sidebarOpen);

  // Responsive layout: auto-collapse sidebar below 900px
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 900) {
        if (!useUIStore.getState().sidebarCollapsed) {
          prevSidebarOpenRef.current = useUIStore.getState().sidebarOpen;
          setSidebarCollapsed(true);
          if (useUIStore.getState().sidebarOpen) {
            toggleSidebar();
          }
        }
      } else {
        if (useUIStore.getState().sidebarCollapsed) {
          setSidebarCollapsed(false);
          if (prevSidebarOpenRef.current && !useUIStore.getState().sidebarOpen) {
            toggleSidebar();
          }
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [toggleSidebar, setSidebarCollapsed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N: new memo
      if (e.metaKey && e.key === "n") {
        e.preventDefault();
        createMemo();
      }
      // Cmd+\: toggle sidebar
      if (e.metaKey && e.key === "\\") {
        e.preventDefault();
        toggleSidebar();
      }
      // Cmd+K: command palette
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
      // Cmd+[: previous memo
      if (e.metaKey && e.key === "[") {
        e.preventDefault();
        selectPrevMemo();
      }
      // Cmd+]: next memo
      if (e.metaKey && e.key === "]") {
        e.preventDefault();
        selectNextMemo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createMemo, toggleSidebar, toggleCommandPalette, selectPrevMemo, selectNextMemo]);

  const handleResize = useCallback(
    (delta: number) => {
      setMemoListWidth(
        Math.min(500, Math.max(200, memoListWidth + delta))
      );
    },
    [memoListWidth, setMemoListWidth]
  );

  return (
    <>
      <div className="flex h-full">
        {sidebarOpen && <Sidebar />}
        {activeView === "memos" ? (
          <>
            <MemoList width={memoListWidth} />
            <ResizeHandle onResize={handleResize} />
            <Editor />
          </>
        ) : (
          <DraftEditor />
        )}
      </div>
      <CommandPalette />
      <TemplateModal />
    </>
  );
}
