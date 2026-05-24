package ai

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"

	"thinkdraft/internal/memo"
	"thinkdraft/internal/tag"
)

// Coach provides AI-powered coaching features: weekly reports, topic suggestions,
// and nudge messages based on the user's memo activity.
type Coach struct {
	claude   *ClaudeClient
	memoRepo *memo.Repository
	tagRepo  *tag.Repository
	logRepo  *CoachLogRepository
}

// NewCoach creates a new Coach with the required dependencies.
func NewCoach(claude *ClaudeClient, memoRepo *memo.Repository, tagRepo *tag.Repository, logRepo *CoachLogRepository) *Coach {
	return &Coach{
		claude:   claude,
		memoRepo: memoRepo,
		tagRepo:  tagRepo,
		logRepo:  logRepo,
	}
}

// GetWeeklyReport gathers the past 7 days of memos, computes stats, and calls
// Claude to generate insights. The result is saved as a coach log.
func (c *Coach) GetWeeklyReport() (*WeeklyReport, error) {
	since := time.Now().UTC().AddDate(0, 0, -7).Format(time.RFC3339)

	memos, err := c.memoRepo.ListSince(since)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch recent memos: %w", err)
	}

	if len(memos) == 0 {
		return nil, fmt.Errorf("no memos found in the past 7 days")
	}

	// Calculate word count.
	totalWords := 0
	var memoParts []string
	for _, m := range memos {
		totalWords += countWords(m.Content)
		memoParts = append(memoParts, m.Content)
	}

	// Get tag distribution for these memos.
	tagCounts := make(map[string]int)
	for _, m := range memos {
		tags, err := c.tagRepo.GetMemoTags(m.ID)
		if err != nil {
			continue
		}
		for _, t := range tags {
			tagCounts[t.Name]++
		}
	}

	var tagDist []TagStat
	for name, count := range tagCounts {
		tagDist = append(tagDist, TagStat{Name: name, Count: count})
	}

	// Build prompt for Claude.
	prompt := buildWeeklyReportPrompt(memoParts, tagDist)
	insights, err := c.claude.Execute(prompt)
	if err != nil {
		return nil, fmt.Errorf("claude analysis failed: %w", err)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	id := ulid.MustNew(ulid.Now(), rand.Reader).String()

	report := &WeeklyReport{
		ID:              id,
		MemoCount:       len(memos),
		WordCount:       totalWords,
		TagDistribution: tagDist,
		Insights:        strings.TrimSpace(insights),
		CreatedAt:       now,
	}

	// Serialize and save to coach logs.
	contentJSON, err := json.Marshal(report)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize report: %w", err)
	}

	log := &CoachLog{
		ID:        id,
		Type:      "weekly_report",
		Content:   string(contentJSON),
		CreatedAt: now,
		Dismissed: false,
	}
	if err := c.logRepo.Insert(log); err != nil {
		return nil, fmt.Errorf("failed to save coach log: %w", err)
	}

	return report, nil
}

// GetTopicSuggestions asks Claude to suggest 3 blog topics based on recent memos.
// The result is saved as a coach log.
func (c *Coach) GetTopicSuggestions() ([]TopicSuggestion, error) {
	since := time.Now().UTC().AddDate(0, 0, -14).Format(time.RFC3339)

	memos, err := c.memoRepo.ListSince(since)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch recent memos: %w", err)
	}

	if len(memos) == 0 {
		return nil, fmt.Errorf("no recent memos found for topic suggestions")
	}

	// Build memo summaries with IDs for the prompt.
	var summaries []coachMemoSummary
	for _, m := range memos {
		preview := m.Content
		if len(preview) > 200 {
			preview = preview[:200] + "..."
		}
		summaries = append(summaries, coachMemoSummary{ID: m.ID, Preview: preview})
	}

	prompt := buildTopicSuggestionPrompt(summaries)
	response, err := c.claude.Execute(prompt)
	if err != nil {
		return nil, fmt.Errorf("claude suggestion failed: %w", err)
	}

	suggestions := parseTopicSuggestions(response, memos)

	now := time.Now().UTC().Format(time.RFC3339)
	id := ulid.MustNew(ulid.Now(), rand.Reader).String()

	contentJSON, err := json.Marshal(suggestions)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize suggestions: %w", err)
	}

	log := &CoachLog{
		ID:        id,
		Type:      "topic_suggestion",
		Content:   string(contentJSON),
		CreatedAt: now,
		Dismissed: false,
	}
	if err := c.logRepo.Insert(log); err != nil {
		return nil, fmt.Errorf("failed to save coach log: %w", err)
	}

	return suggestions, nil
}

// CheckNudge checks how long since the last memo and returns a nudge message
// if 3 or more days have passed. Returns nil if no nudge is needed.
func (c *Coach) CheckNudge() (*NudgeMessage, error) {
	lastDate, err := c.memoRepo.GetLastMemoDate()
	if err != nil {
		if err == sql.ErrNoRows {
			return c.createNudge(7), nil
		}
		return nil, fmt.Errorf("failed to get last memo date: %w", err)
	}

	lastTime, err := time.Parse(time.RFC3339, lastDate)
	if err != nil {
		return nil, fmt.Errorf("failed to parse last memo date: %w", err)
	}

	daysSince := int(time.Since(lastTime).Hours() / 24)

	if daysSince < 3 {
		return nil, nil
	}

	return c.createNudge(daysSince), nil
}

// createNudge builds and persists a nudge message based on the number of days
// since the last memo.
func (c *Coach) createNudge(daysSince int) *NudgeMessage {
	now := time.Now().UTC().Format(time.RFC3339)
	id := ulid.MustNew(ulid.Now(), rand.Reader).String()

	var message string
	if daysSince < 7 {
		message = fmt.Sprintf("%d일째 메모가 없어요. 오늘 배운 것을 기록해보세요!", daysSince)
	} else {
		message = fmt.Sprintf("벌써 %d일이나 지났네요! 작은 것이라도 기록하면 나중에 큰 자산이 됩니다.", daysSince)
	}

	nudge := &NudgeMessage{
		ID:        id,
		Message:   message,
		DaysSince: daysSince,
		CreatedAt: now,
	}

	contentJSON, err := json.Marshal(nudge)
	if err == nil {
		log := &CoachLog{
			ID:        id,
			Type:      "nudge",
			Content:   string(contentJSON),
			CreatedAt: now,
			Dismissed: false,
		}
		// Best effort save; do not fail the nudge if logging fails.
		_ = c.logRepo.Insert(log)
	}

	return nudge
}

// GetCoachLogs returns recent coach logs filtered by type.
func (c *Coach) GetCoachLogs(logType string, limit int) ([]CoachLog, error) {
	if limit <= 0 {
		limit = 20
	}
	return c.logRepo.List(logType, limit)
}

// DismissLog marks a coach log as dismissed.
func (c *Coach) DismissLog(id string) error {
	return c.logRepo.Dismiss(id)
}

// countWords counts whitespace-separated tokens in a string.
func countWords(s string) int {
	return len(strings.Fields(s))
}

// buildWeeklyReportPrompt constructs the prompt for weekly report analysis.
func buildWeeklyReportPrompt(memoParts []string, tagDist []TagStat) string {
	var sb strings.Builder

	sb.WriteString("다음은 사용자가 이번 주에 작성한 메모들이야. 분석해서 인사이트를 제공해줘.\n\n")
	sb.WriteString("분석 항목:\n")
	sb.WriteString("1. 이번 주 다룬 주요 주제\n")
	sb.WriteString("2. 학습 패턴 (어떤 분야에 집중했는지)\n")
	sb.WriteString("3. 2~3개의 실천 가능한 인사이트\n\n")

	if len(tagDist) > 0 {
		sb.WriteString("태그 분포:\n")
		for _, t := range tagDist {
			sb.WriteString(fmt.Sprintf("- %s: %d개\n", t.Name, t.Count))
		}
		sb.WriteString("\n")
	}

	sb.WriteString("메모 내용:\n\n")
	for i, part := range memoParts {
		sb.WriteString(fmt.Sprintf("--- 메모 %d ---\n%s\n\n", i+1, part))
	}

	sb.WriteString("한국어로 답변해줘. 마크다운 형식으로 간결하게 작성해줘.")

	return sb.String()
}

// coachMemoSummary holds a memo ID and a truncated preview for prompt building.
type coachMemoSummary struct {
	ID      string
	Preview string
}

// buildTopicSuggestionPrompt constructs the prompt for topic suggestions.
func buildTopicSuggestionPrompt(summaries []coachMemoSummary) string {
	var sb strings.Builder

	sb.WriteString("다음은 사용자가 최근에 작성한 메모 요약이야. ")
	sb.WriteString("이 메모들을 바탕으로 블로그 글로 발전시킬 수 있는 주제 3개를 제안해줘.\n\n")
	sb.WriteString("각 제안은 다음 형식으로 작성해줘:\n")
	sb.WriteString("제목: (짧은 제목)\n")
	sb.WriteString("설명: (1문장 설명)\n\n")

	for i, s := range summaries {
		sb.WriteString(fmt.Sprintf("--- 메모 %d (ID: %s) ---\n%s\n\n", i+1, s.ID, s.Preview))
	}

	sb.WriteString("한국어로 답변해줘. 다른 설명 없이 3개의 제안만 출력해줘.")

	return sb.String()
}

// parseTopicSuggestions extracts topic suggestions from Claude's response.
// It attempts to parse "제목:" and "설명:" patterns and associates related memo IDs.
func parseTopicSuggestions(response string, memos []memo.Memo) []TopicSuggestion {
	lines := strings.Split(response, "\n")
	var suggestions []TopicSuggestion
	var current *TopicSuggestion

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if strings.HasPrefix(line, "제목:") || strings.HasPrefix(line, "제목 :") {
			if current != nil {
				suggestions = append(suggestions, *current)
			}
			title := strings.TrimSpace(strings.SplitN(line, ":", 2)[1])
			current = &TopicSuggestion{Title: title}
		} else if current != nil && (strings.HasPrefix(line, "설명:") || strings.HasPrefix(line, "설명 :")) {
			desc := strings.TrimSpace(strings.SplitN(line, ":", 2)[1])
			current.Description = desc
		}
	}
	if current != nil {
		suggestions = append(suggestions, *current)
	}

	// If parsing failed, create a single suggestion from the raw response.
	if len(suggestions) == 0 {
		suggestions = append(suggestions, TopicSuggestion{
			Title:       "AI 추천 주제",
			Description: strings.TrimSpace(response),
		})
	}

	// Associate related memo IDs (distribute memos across suggestions).
	memoIDs := make([]string, len(memos))
	for i, m := range memos {
		memoIDs[i] = m.ID
	}

	for i := range suggestions {
		if len(memoIDs) > 0 {
			// Assign a subset of memo IDs to each suggestion.
			chunkSize := (len(memoIDs) + len(suggestions) - 1) / len(suggestions)
			start := i * chunkSize
			end := start + chunkSize
			if start >= len(memoIDs) {
				suggestions[i].RelatedMemoIDs = []string{}
				continue
			}
			if end > len(memoIDs) {
				end = len(memoIDs)
			}
			suggestions[i].RelatedMemoIDs = memoIDs[start:end]
		} else {
			suggestions[i].RelatedMemoIDs = []string{}
		}
	}

	return suggestions
}
