package sync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// PushItem represents a single local change to be sent to the remote server.
type PushItem struct {
	Entity   string `json:"entity"`
	EntityID string `json:"entityId"`
	Action   string `json:"action"`
	Payload  string `json:"payload"`
}

// PullItem represents a single remote change received from the server.
type PullItem struct {
	Entity   string `json:"entity"`
	EntityID string `json:"entityId"`
	Action   string `json:"action"`
	Payload  string `json:"payload"`
}

// PushRequest is the HTTP request body sent to POST /api/sync/push.
type PushRequest struct {
	Items []PushItem `json:"items"`
}

// PullRequest is the HTTP request body sent to POST /api/sync/pull.
type PullRequest struct {
	LastSyncedAt string `json:"lastSyncedAt"`
}

// PullResponse is the HTTP response body returned from POST /api/sync/pull.
type PullResponse struct {
	Items []PullItem `json:"items"`
}

// Client is an HTTP client that communicates with the remote NestJS sync API.
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// NewClient creates a new sync Client targeting the given server base URL.
func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Push sends local changes to the remote server.
func (c *Client) Push(items []PushItem) error {
	body, err := json.Marshal(PushRequest{Items: items})
	if err != nil {
		return fmt.Errorf("marshalling push request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL+"/api/sync/push", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("creating push request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("push request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("push returned status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// Pull fetches remote changes that occurred since the given timestamp.
func (c *Client) Pull(lastSyncedAt string) ([]PullItem, error) {
	body, err := json.Marshal(PullRequest{LastSyncedAt: lastSyncedAt})
	if err != nil {
		return nil, fmt.Errorf("marshalling pull request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL+"/api/sync/pull", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("creating pull request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("pull request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("pull returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var pullResp PullResponse
	if err := json.NewDecoder(resp.Body).Decode(&pullResp); err != nil {
		return nil, fmt.Errorf("decoding pull response: %w", err)
	}

	return pullResp.Items, nil
}
