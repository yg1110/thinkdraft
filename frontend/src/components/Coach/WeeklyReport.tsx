import { useEffect } from "react";
import { useCoachStore } from "../../stores/coachStore";
import CoachBanner from "./CoachBanner";

export default function WeeklyReport() {
  const {
    weeklyReport,
    topicSuggestions,
    loading,
    error,
    loadWeeklyReport,
    loadTopicSuggestions,
  } = useCoachStore();

  useEffect(() => {
    if (weeklyReport) {
      loadTopicSuggestions();
    }
  }, [weeklyReport, loadTopicSuggestions]);

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{
        background: "var(--color-canvas)",
        paddingTop: "var(--titlebar-height)",
      }}
    >
      {/* Titlebar drag area */}
      <div className="titlebar-drag" style={{ height: "var(--spacing-sm)" }} />

      {/* Coach banner at top */}
      <CoachBanner />

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: "var(--spacing-lg) var(--spacing-xxl) var(--spacing-xl)",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "var(--spacing-lg)" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 600,
              lineHeight: 1.18,
              letterSpacing: "-0.22px",
              color: "var(--color-ink)",
              marginBottom: "var(--spacing-xxs)",
            }}
          >
            AI Coach
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-ink-secondary)",
            }}
          >
            이번 주 메모 활동을 분석하고 글쓰기 주제를 추천해드립니다
          </p>
        </div>

        {/* Generate Report button when no report */}
        {!weeklyReport && !loading && (
          <div
            style={{
              background: "var(--color-canvas-elevated)",
              borderRadius: "var(--rounded-lg)",
              padding: "var(--spacing-xl)",
              border: "1px solid var(--color-hairline)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                color: "var(--color-ink-secondary)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              주간 리포트를 생성하여 이번 주 활동을 확인하세요
            </div>
            <button
              onClick={loadWeeklyReport}
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--rounded-md)",
                padding: "10px 24px",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Generate Report
            </button>
            {error && (
              <div
                style={{
                  color: "var(--color-ink-danger)",
                  fontSize: "13px",
                  marginTop: "var(--spacing-sm)",
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div
            style={{
              background: "var(--color-canvas-elevated)",
              borderRadius: "var(--rounded-lg)",
              padding: "var(--spacing-xl)",
              border: "1px solid var(--color-hairline)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "2px solid var(--color-hairline)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto var(--spacing-md)",
              }}
            />
            <div
              style={{
                fontSize: "14px",
                color: "var(--color-ink-secondary)",
              }}
            >
              Claude가 분석 중입니다...
            </div>
          </div>
        )}

        {/* Report content */}
        {weeklyReport && !loading && (
          <>
            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--spacing-md)",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              <StatCard label="Memos" value={weeklyReport.memoCount} />
              <StatCard
                label="Words"
                value={weeklyReport.wordCount.toLocaleString()}
              />
            </div>

            {/* Tag distribution */}
            {weeklyReport.tagDistribution &&
              weeklyReport.tagDistribution.length > 0 && (
                <div
                  style={{
                    background: "var(--color-canvas-elevated)",
                    borderRadius: "var(--rounded-lg)",
                    padding: "var(--spacing-lg)",
                    border: "1px solid var(--color-hairline)",
                    marginBottom: "var(--spacing-lg)",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      marginBottom: "var(--spacing-md)",
                    }}
                  >
                    Tag Distribution
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--spacing-xs)",
                    }}
                  >
                    {weeklyReport.tagDistribution.map((tag) => {
                      const maxCount = Math.max(
                        ...weeklyReport.tagDistribution.map((t) => t.count)
                      );
                      const widthPercent =
                        maxCount > 0 ? (tag.count / maxCount) * 100 : 0;
                      return (
                        <div
                          key={tag.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--spacing-sm)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "var(--color-ink-secondary)",
                              width: "80px",
                              flexShrink: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {tag.name}
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: "8px",
                              background: "var(--color-canvas-secondary)",
                              borderRadius: "var(--rounded-pill)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${widthPercent}%`,
                                height: "100%",
                                background: "var(--color-primary)",
                                borderRadius: "var(--rounded-pill)",
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--color-ink-tertiary)",
                              width: "24px",
                              textAlign: "right",
                              flexShrink: 0,
                            }}
                          >
                            {tag.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* AI Insights */}
            {weeklyReport.insights && (
              <div
                style={{
                  background: "var(--color-canvas-elevated)",
                  borderRadius: "var(--rounded-lg)",
                  padding: "var(--spacing-lg)",
                  border: "1px solid var(--color-hairline)",
                  marginBottom: "var(--spacing-lg)",
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--color-ink)",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  AI Insights
                </h2>
                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "var(--color-ink-secondary)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {weeklyReport.insights}
                </div>
              </div>
            )}

            {/* Topic suggestions */}
            {topicSuggestions.length > 0 && (
              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--color-ink)",
                    marginBottom: "var(--spacing-md)",
                  }}
                >
                  추천 글쓰기 주제
                </h2>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--spacing-sm)",
                  }}
                >
                  {topicSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      style={{
                        background: "var(--color-canvas)",
                        borderRadius: "var(--rounded-lg)",
                        padding: "var(--spacing-md) var(--spacing-lg)",
                        border: "1px solid var(--color-hairline)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "var(--color-ink)",
                          marginBottom: "var(--spacing-xxs)",
                        }}
                      >
                        {suggestion.title}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.5,
                          color: "var(--color-ink-secondary)",
                          marginBottom: "var(--spacing-sm)",
                        }}
                      >
                        {suggestion.description}
                      </div>
                      {suggestion.relatedMemoIds &&
                        suggestion.relatedMemoIds.length > 0 && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--color-ink-tertiary)",
                              marginBottom: "var(--spacing-xs)",
                            }}
                          >
                            관련 메모 {suggestion.relatedMemoIds.length}개
                          </div>
                        )}
                      <button
                        style={{
                          background: "var(--color-primary-muted)",
                          color: "var(--color-primary)",
                          border: "none",
                          borderRadius: "var(--rounded-md)",
                          padding: "6px 14px",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--color-primary)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "var(--color-primary-muted)";
                          e.currentTarget.style.color = "var(--color-primary)";
                        }}
                      >
                        이 주제로 글 써볼래?
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate button */}
            <div style={{ textAlign: "center", paddingTop: "var(--spacing-sm)" }}>
              <button
                onClick={loadWeeklyReport}
                style={{
                  background: "var(--color-canvas-secondary)",
                  color: "var(--color-ink-secondary)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--rounded-md)",
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--color-primary)";
                  e.currentTarget.style.color = "var(--color-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--color-hairline)";
                  e.currentTarget.style.color = "var(--color-ink-secondary)";
                }}
              >
                Regenerate Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div
      style={{
        background: "var(--color-canvas-elevated)",
        borderRadius: "var(--rounded-lg)",
        padding: "var(--spacing-lg)",
        border: "1px solid var(--color-hairline)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "var(--color-primary)",
          fontSize: "28px",
          fontWeight: 600,
          lineHeight: 1.2,
          marginBottom: "var(--spacing-xxs)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "var(--color-ink-secondary)",
          fontSize: "13px",
        }}
      >
        {label}
      </div>
    </div>
  );
}
