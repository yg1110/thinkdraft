import { useEffect, useState } from "react";
import { useCoachStore } from "../../stores/coachStore";

export default function CoachBanner() {
  const { nudge, dismissNudge } = useCoachStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (nudge) {
      // Trigger entrance animation after mount
      const timer = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [nudge]);

  if (!nudge) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: "var(--color-primary-muted)",
        color: "var(--color-ink)",
        borderRadius: "var(--rounded-lg)",
        padding: "var(--spacing-md) var(--spacing-lg)",
        margin: "var(--spacing-sm) var(--spacing-lg) 0",
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--spacing-sm)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-primary)",
            marginBottom: "var(--spacing-xxs)",
          }}
        >
          AI Coach
        </div>
        <div
          style={{
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          {nudge.message}
        </div>
        {nudge.daysSince > 0 && (
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-ink-secondary)",
              marginTop: "var(--spacing-xxs)",
            }}
          >
            {nudge.daysSince}일 전부터 메모를 쓰지 않았어요
          </div>
        )}
      </div>
      <button
        onClick={dismissNudge}
        aria-label="Dismiss coach nudge"
        style={{
          background: "none",
          border: "none",
          color: "var(--color-ink-secondary)",
          cursor: "pointer",
          padding: "2px",
          fontSize: "16px",
          lineHeight: 1,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--color-ink)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--color-ink-secondary)";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 3L11 11M11 3L3 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
