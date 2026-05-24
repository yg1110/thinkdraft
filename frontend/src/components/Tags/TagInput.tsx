import { useState, useEffect, useRef, useCallback } from "react";
import { useTagStore } from "../../stores/tagStore";
import { tag } from "../../../wailsjs/go/models";

interface TagInputProps {
  memoID: string;
}

export default function TagInput({ memoID }: TagInputProps) {
  const {
    memoTags,
    suggestedTags,
    suggestingTags,
    loadMemoTags,
    addTag,
    removeTag,
    suggestTags,
    acceptSuggestedTag,
    dismissSuggestedTag,
    clearSuggestions,
  } = useTagStore();

  const [inputValue, setInputValue] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState<tag.Tag[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load memo tags when memoID changes
  useEffect(() => {
    loadMemoTags(memoID);
    clearSuggestions();

    // Debounced suggest tags
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = setTimeout(() => {
      suggestTags(memoID);
    }, 1500);

    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [memoID, loadMemoTags, suggestTags, clearSuggestions]);

  // Autocomplete search
  useEffect(() => {
    if (!inputValue.trim()) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    let cancelled = false;
    const doSearch = async () => {
      const { searchTags } = useTagStore.getState();
      const results = await searchTags(inputValue.trim());
      if (!cancelled) {
        // Filter out tags already on this memo
        const existingNames = new Set(memoTags.map((t) => t.name.toLowerCase()));
        const filtered = results.filter(
          (t) => !existingNames.has(t.name.toLowerCase())
        );
        setAutocompleteResults(filtered);
        setShowAutocomplete(filtered.length > 0);
        setSelectedIndex(0);
      }
    };
    doSearch();
    return () => {
      cancelled = true;
    };
  }, [inputValue, memoTags]);

  const handleAddTag = useCallback(
    async (tagName: string) => {
      const trimmed = tagName.trim();
      if (!trimmed) return;
      // Check if already added
      if (memoTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
        return;
      }
      await addTag(memoID, trimmed);
      setInputValue("");
      setShowAutocomplete(false);
    },
    [memoID, memoTags, addTag]
  );

  const handleRemoveTag = useCallback(
    async (tagID: string) => {
      await removeTag(memoID, tagID);
    },
    [memoID, removeTag]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (showAutocomplete && autocompleteResults[selectedIndex]) {
          handleAddTag(autocompleteResults[selectedIndex].name);
        } else {
          handleAddTag(inputValue);
        }
        return;
      }
      if (e.key === "Escape") {
        setShowAutocomplete(false);
        return;
      }
      if (showAutocomplete) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, autocompleteResults.length - 1)
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
      }
    },
    [showAutocomplete, autocompleteResults, selectedIndex, inputValue, handleAddTag]
  );

  const handleAcceptSuggestion = useCallback(
    async (tagName: string) => {
      await acceptSuggestedTag(memoID, tagName);
    },
    [memoID, acceptSuggestedTag]
  );

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter out suggested tags that are already on this memo
  const visibleSuggestions = suggestedTags.filter(
    (s) => !memoTags.some((t) => t.name.toLowerCase() === s.toLowerCase())
  );

  return (
    <div
      style={{
        padding: "0 var(--spacing-xxl) var(--spacing-md)",
      }}
    >
      {/* Tags row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {/* Existing tags */}
        {memoTags.map((t) => (
          <span
            key={t.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "var(--color-canvas-secondary)",
              color: "var(--color-ink-secondary)",
              borderRadius: "var(--rounded-xs)",
              padding: "3px 8px",
              fontSize: "12px",
              lineHeight: 1,
            }}
          >
            {t.name}
            <button
              onClick={() => handleRemoveTag(t.id)}
              aria-label={`Remove tag: ${t.name}`}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-ink-tertiary)",
                cursor: "pointer",
                padding: 0,
                fontSize: "12px",
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-ink-danger)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-ink-tertiary)";
              }}
            >
              x
            </button>
          </span>
        ))}

        {/* AI suggested tags */}
        {visibleSuggestions.map((tagName) => (
          <span
            key={`suggestion-${tagName}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "var(--color-primary-muted)",
              color: "var(--color-primary)",
              border: "1px dashed var(--color-primary)",
              borderRadius: "var(--rounded-xs)",
              padding: "2px 7px",
              fontSize: "12px",
              lineHeight: 1,
              cursor: "pointer",
            }}
            onClick={() => handleAcceptSuggestion(tagName)}
          >
            {tagName}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissSuggestedTag(tagName);
              }}
              aria-label={`Dismiss suggested tag: ${tagName}`}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary)",
                cursor: "pointer",
                padding: 0,
                fontSize: "11px",
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.6";
              }}
            >
              x
            </button>
          </span>
        ))}

        {suggestingTags && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-ink-tertiary)",
              fontStyle: "italic",
            }}
          >
            suggesting...
          </span>
        )}

        {/* Tag input */}
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Add tag..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (autocompleteResults.length > 0 && inputValue.trim()) {
                setShowAutocomplete(true);
              }
            }}
            style={{
              background: "transparent",
              color: "var(--color-ink)",
              border: "none",
              outline: "none",
              fontSize: "12px",
              fontFamily: "var(--font-body)",
              padding: "3px 4px",
              width: "100px",
            }}
          />

          {/* Autocomplete dropdown */}
          {showAutocomplete && (
            <div
              ref={autocompleteRef}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "4px",
                background: "var(--color-canvas-elevated)",
                border: "1px solid var(--color-hairline)",
                borderRadius: "var(--rounded-md)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                maxHeight: "160px",
                width: "180px",
                overflowY: "auto",
                zIndex: 1100,
                padding: "var(--spacing-xxs) 0",
              }}
            >
              {autocompleteResults.map((t, index) => (
                <button
                  key={t.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddTag(t.name);
                  }}
                  style={{
                    width: "100%",
                    display: "block",
                    textAlign: "left",
                    padding: "var(--spacing-xs) var(--spacing-sm)",
                    background:
                      index === selectedIndex
                        ? "var(--color-primary-muted)"
                        : "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-ink)",
                    fontSize: "12px",
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
