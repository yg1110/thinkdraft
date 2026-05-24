import { useEffect, useRef } from "react";
import { useSyncStore } from "../../stores/syncStore";

function formatLastSynced(iso: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function SyncIndicator() {
  const { status, lastSynced, loadStatus, syncNow } = useSyncStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load initial status and poll every 10 seconds
  useEffect(() => {
    loadStatus();
    intervalRef.current = setInterval(() => {
      loadStatus();
    }, 10_000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadStatus]);

  const handleClick = () => {
    if (status !== "syncing") {
      syncNow();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const timeLabel = formatLastSynced(lastSynced);

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={getSyncAriaLabel(status, timeLabel)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: "none",
        cursor: status === "syncing" ? "default" : "pointer",
        padding: "0",
        fontSize: "13px",
        fontFamily: "var(--font-body)",
        color: getStatusColor(status),
        lineHeight: 1,
      }}
    >
      <StatusDot status={status} />
      <span>{getStatusLabel(status)}</span>
      {status === "idle" && timeLabel && (
        <span
          style={{
            color: "var(--color-ink-tertiary)",
            fontSize: "12px",
          }}
        >
          {timeLabel}
        </span>
      )}
    </button>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "syncing") {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          border: "2px solid var(--color-primary)",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
          flexShrink: 0,
        }}
      />
    );
  }

  let dotColor: string;
  switch (status) {
    case "idle":
      dotColor = "var(--color-ink-success)";
      break;
    case "error":
      dotColor = "var(--color-ink-warning)";
      break;
    case "offline":
    default:
      dotColor = "var(--color-ink-tertiary)";
      break;
  }

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: dotColor,
        flexShrink: 0,
      }}
    />
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "idle":
      return "var(--color-ink-success)";
    case "syncing":
      return "var(--color-ink-tertiary)";
    case "error":
      return "var(--color-ink-warning)";
    case "offline":
      return "var(--color-ink-tertiary)";
    default:
      return "var(--color-ink-tertiary)";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "idle":
      return "Synced";
    case "syncing":
      return "Syncing...";
    case "error":
      return "Sync error";
    case "offline":
      return "Offline";
    default:
      return "Offline";
  }
}

function getSyncAriaLabel(status: string, timeLabel: string): string {
  switch (status) {
    case "idle":
      return timeLabel ? `Synced ${timeLabel}. Click to sync now.` : "Synced. Click to sync now.";
    case "syncing":
      return "Syncing in progress";
    case "error":
      return "Sync error. Click to retry.";
    case "offline":
      return "Offline. Click to attempt sync.";
    default:
      return "Sync status unknown";
  }
}
