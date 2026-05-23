import { useState, useEffect, useRef, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useMemoStore } from "../../stores/memoStore";
import { useBlogStore } from "../../stores/blogStore";

const TEMPLATES = [
  { id: "til", label: "TIL (Today I Learned)" },
  { id: "troubleshoot", label: "Troubleshoot" },
  { id: "concept", label: "Concept" },
  { id: "retrospective", label: "Retrospective" },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

export default function TemplateModal() {
  const { templateModalOpen, closeTemplateModal, setActiveView } = useUIStore();
  const { selectedIds, clearSelection } = useMemoStore();
  const { generateDraft, generating, error } = useBlogStore();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (templateModalOpen) {
      setSelectedTemplate(null);
      setLocalError(null);
      setTimeout(() => cancelRef.current?.focus(), 0);
    }
  }, [templateModalOpen]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  useEffect(() => {
    if (!templateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !generating) {
        e.preventDefault();
        closeTemplateModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [templateModalOpen, generating, closeTemplateModal]);

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate || selectedIds.size === 0) return;
    setLocalError(null);
    try {
      await generateDraft(Array.from(selectedIds), selectedTemplate);
      closeTemplateModal();
      clearSelection();
      setActiveView("drafts");
    } catch {
      // error is set in the store and synced via useEffect
    }
  }, [selectedTemplate, selectedIds, generateDraft, closeTemplateModal, clearSelection, setActiveView]);

  const handleRetry = useCallback(() => {
    setLocalError(null);
    handleGenerate();
  }, [handleGenerate]);

  if (!templateModalOpen) return null;

  return (
    <div
      onClick={() => { if (!generating) closeTemplateModal(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Select blog template"
        style={{
          background: "var(--color-canvas-elevated)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--rounded-lg)",
          padding: "var(--spacing-lg)",
          minWidth: "380px",
          maxWidth: "440px",
        }}
      >
        {generating ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-lg) 0" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid var(--color-canvas-secondary)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto var(--spacing-md)",
              }}
            />
            <div
              style={{
                color: "var(--color-ink)",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "var(--spacing-xs)",
              }}
            >
              AI가 글을 정리하고 있습니다...
            </div>
            <div
              style={{
                color: "var(--color-ink-tertiary)",
                fontSize: "13px",
              }}
            >
              This may take a moment
            </div>
          </div>
        ) : localError ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-md) 0" }}>
            <div
              style={{
                color: "var(--color-ink-danger)",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "var(--spacing-xs)",
              }}
            >
              Generation failed
            </div>
            <div
              style={{
                color: "var(--color-ink-secondary)",
                fontSize: "13px",
                marginBottom: "var(--spacing-lg)",
                wordBreak: "break-word",
              }}
            >
              {localError}
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-xs)", justifyContent: "center" }}>
              <button
                onClick={() => { closeTemplateModal(); setLocalError(null); }}
                style={{
                  background: "var(--color-canvas-secondary)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--rounded-md)",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                style={{
                  background: "var(--color-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--rounded-md)",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                color: "var(--color-ink)",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "var(--spacing-xs)",
              }}
            >
              Select a template
            </div>
            <div
              style={{
                color: "var(--color-ink-secondary)",
                fontSize: "13px",
                marginBottom: "var(--spacing-md)",
              }}
            >
              {selectedIds.size} memo{selectedIds.size !== 1 ? "s" : ""} selected
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--spacing-xs)",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  style={{
                    background:
                      selectedTemplate === t.id
                        ? "var(--color-primary)"
                        : "var(--color-canvas-secondary)",
                    color:
                      selectedTemplate === t.id
                        ? "#fff"
                        : "var(--color-ink)",
                    border: "none",
                    borderRadius: "var(--rounded-pill)",
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: "var(--spacing-xs)",
                justifyContent: "flex-end",
              }}
            >
              <button
                ref={cancelRef}
                onClick={closeTemplateModal}
                style={{
                  background: "var(--color-canvas-secondary)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--rounded-md)",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedTemplate}
                style={{
                  background: selectedTemplate
                    ? "var(--color-primary)"
                    : "var(--color-canvas-secondary)",
                  color: selectedTemplate ? "#fff" : "var(--color-ink-tertiary)",
                  border: "none",
                  borderRadius: "var(--rounded-md)",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: selectedTemplate ? "pointer" : "default",
                  opacity: selectedTemplate ? 1 : 0.6,
                }}
              >
                생성하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
