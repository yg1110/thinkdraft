package ai

import (
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

// ClaudeClient wraps the Claude CLI (claude command) for executing prompts.
type ClaudeClient struct {
	timeout time.Duration
}

// NewClaudeClient creates a new ClaudeClient with a 60-second timeout.
func NewClaudeClient() *ClaudeClient {
	return &ClaudeClient{
		timeout: 60 * time.Second,
	}
}

// CheckInstalled verifies the Claude CLI is available on the system PATH.
func CheckInstalled() bool {
	_, err := exec.LookPath("claude")
	return err == nil
}

// Execute runs a prompt through the Claude CLI and returns the response text.
func (c *ClaudeClient) Execute(prompt string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), c.timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "claude", "--print", "--model", "sonnet", "-p", prompt)

	output, err := cmd.Output()
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return "", fmt.Errorf("claude CLI timed out after %s", c.timeout)
		}
		if exitErr, ok := err.(*exec.ExitError); ok {
			stderr := strings.TrimSpace(string(exitErr.Stderr))
			if stderr != "" {
				return "", fmt.Errorf("claude CLI error: %s", stderr)
			}
		}
		if errors.Is(err, exec.ErrNotFound) {
			return "", fmt.Errorf("claude CLI is not installed; please install it first")
		}
		return "", fmt.Errorf("claude CLI execution failed: %w", err)
	}

	return strings.TrimSpace(string(output)), nil
}
