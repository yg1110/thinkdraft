package ai

import (
	"fmt"
	"strings"
)

// Tagger uses the Claude CLI to suggest tags for memo content.
type Tagger struct {
	claude *ClaudeClient
}

// NewTagger creates a new Tagger backed by the given Claude client.
func NewTagger(claude *ClaudeClient) *Tagger {
	return &Tagger{claude: claude}
}

// SuggestTags asks Claude to suggest 3-5 tags for the given memo content.
// The existingTags slice is provided so that Claude can prefer reusing tags
// that already exist in the system.
func (t *Tagger) SuggestTags(memoContent string, existingTags []string) ([]string, error) {
	prompt := buildTagPrompt(memoContent, existingTags)

	response, err := t.claude.Execute(prompt)
	if err != nil {
		return nil, fmt.Errorf("tag suggestion failed: %w", err)
	}

	return parseTagResponse(response), nil
}

// buildTagPrompt constructs the prompt for tag suggestion.
func buildTagPrompt(content string, existingTags []string) string {
	var sb strings.Builder

	sb.WriteString("다음 메모 내용을 분석해서 적절한 태그를 3~5개 제안해줘.\n")
	sb.WriteString("규칙:\n")
	sb.WriteString("- 태그는 소문자 영어 또는 한글로 작성\n")
	sb.WriteString("- 각 태그는 1~2단어로 간결하게\n")
	sb.WriteString("- 쉼표로 구분해서 한 줄로 출력 (다른 설명 없이 태그만)\n")

	if len(existingTags) > 0 {
		sb.WriteString("\n이미 존재하는 태그 목록 (가능하면 이 중에서 재사용해줘):\n")
		sb.WriteString(strings.Join(existingTags, ", "))
		sb.WriteString("\n")
	}

	sb.WriteString("\n---\n")
	sb.WriteString(content)

	return sb.String()
}

// parseTagResponse extracts clean tag names from Claude's response.
// It handles comma-separated and newline-separated formats.
func parseTagResponse(response string) []string {
	response = strings.TrimSpace(response)
	if response == "" {
		return nil
	}

	// Try comma-separated first.
	var raw []string
	if strings.Contains(response, ",") {
		raw = strings.Split(response, ",")
	} else {
		raw = strings.Split(response, "\n")
	}

	seen := make(map[string]bool)
	var tags []string
	for _, t := range raw {
		t = strings.TrimSpace(t)
		// Strip leading list markers like "- ", "* ", "1. ", etc.
		t = strings.TrimLeft(t, "-*0123456789. ")
		t = strings.TrimSpace(t)
		t = strings.ToLower(t)
		if t == "" || seen[t] {
			continue
		}
		seen[t] = true
		tags = append(tags, t)
	}

	return tags
}
