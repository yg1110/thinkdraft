import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
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
        style={{
          background: "var(--color-canvas-elevated)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--rounded-lg)",
          padding: "var(--spacing-lg)",
          minWidth: "320px",
          maxWidth: "400px",
        }}
      >
        <div
          style={{
            color: "var(--color-ink)",
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "var(--spacing-md)",
          }}
        >
          {message}
        </div>
        <div
          style={{
            color: "var(--color-ink-secondary)",
            fontSize: "13px",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          This action cannot be undone.
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-xs)", justifyContent: "flex-end" }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
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
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: "var(--color-ink-danger)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--rounded-md)",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
