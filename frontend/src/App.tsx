import { useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import MemoList from "./components/MemoList/MemoList";
import Editor from "./components/Editor/Editor";
import { useUIStore } from "./stores/uiStore";
import { useMemoStore } from "./stores/memoStore";

export default function App() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { createMemo } = useMemoStore();

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
      // Cmd+K: focus search
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder="Search memos..."]'
        );
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createMemo, toggleSidebar]);

  return (
    <div className="flex h-full">
      {sidebarOpen && <Sidebar />}
      <MemoList />
      <Editor />
    </div>
  );
}
