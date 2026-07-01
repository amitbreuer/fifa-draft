#!/bin/bash
# ============================================================================
# Copilot CLI agentStop Hook — Auto-update project documentation
# ============================================================================
# This hook fires every time the Copilot agent finishes a turn. It checks
# whether significant code changes were made and, if so, forces the agent
# to review and update the project's implementation documentation.
#
# Portability: Copy the .github/hooks/ directory to any project that has
# implementation docs that should be kept in sync with code changes.
#
# Infinite-loop prevention: The agent is instructed to include a marker
# phrase (DOCS_REVIEW_COMPLETE) in its response. On the next agentStop,
# the hook detects this marker in the transcript and allows the stop.
# ============================================================================

set -euo pipefail

INPUT=$(cat)

# --- Extract transcriptPath from the JSON input ---
# Try python3 first (most reliable), then python, then fallback to grep
extract_transcript_path() {
    local path=""
    if command -v python3 &>/dev/null; then
        path=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('transcriptPath', d.get('transcript_path', '')))" 2>/dev/null)
    elif command -v python &>/dev/null; then
        path=$(echo "$INPUT" | python -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('transcriptPath', d.get('transcript_path', '')))" 2>/dev/null)
    else
        # Fallback: grep-based extraction (handles simple flat JSON)
        path=$(echo "$INPUT" | grep -oE '"transcriptPath"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"transcriptPath"\s*:\s*"//;s/"$//')
        if [ -z "$path" ]; then
            path=$(echo "$INPUT" | grep -oE '"transcript_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"transcript_path"\s*:\s*"//;s/"$//')
        fi
    fi
    echo "$path"
}

TRANSCRIPT_PATH=$(extract_transcript_path)

# --- Check 1: Was docs review already completed? ---
# Look for the marker phrase in the transcript, indicating the agent already
# reviewed the changes and either updated docs or determined no update needed.
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    if grep -q "DOCS_REVIEW_COMPLETE" "$TRANSCRIPT_PATH" 2>/dev/null; then
        echo '{"decision": "allow"}'
        exit 0
    fi
fi

# --- Check 2: Were any meaningful code changes made? ---
# If no source files were changed (only docs, config, or no changes at all),
# skip the docs review entirely.
has_code_changes() {
    # Check both staged and unstaged changes
    local changed_files=""
    changed_files=$(git diff --name-only HEAD 2>/dev/null; git diff --cached --name-only 2>/dev/null; git diff --name-only 2>/dev/null)

    # Also check untracked files (new files created by the agent)
    changed_files="$changed_files"$'\n'"$(git ls-files --others --exclude-standard 2>/dev/null)"

    # Remove empty lines and deduplicate
    changed_files=$(echo "$changed_files" | sort -u | grep -v '^$')

    if [ -z "$changed_files" ]; then
        return 1
    fi

    # Filter out documentation-only and config-only changes
    # If ALL changed files match these patterns, it's not a significant code change
    local non_doc_files
    non_doc_files=$(echo "$changed_files" | grep -ivE \
        '^\.(github|vscode|idea|claude|cursor|copilot)/|^docs/|^\.copilot|^README\.md$|^DOCUMENTATION\.md$|^CHANGELOG\.md$|^LICENSE|^\.gitignore$|^\.editorconfig$|^\.prettierrc|^\.eslintrc|\.lock$' \
        || true)

    if [ -z "$non_doc_files" ]; then
        return 1
    fi

    return 0
}

if ! has_code_changes; then
    echo '{"decision": "allow"}'
    exit 0
fi

# --- Block: Force the agent to review and update docs ---
# Detect documentation locations in the project for a context-aware prompt
find_docs_locations() {
    local locations=""
    [ -d "docs" ] && locations="${locations}docs/ directory, "
    [ -f "DOCUMENTATION.md" ] && locations="${locations}DOCUMENTATION.md, "
    [ -f "ARCHITECTURE.md" ] && locations="${locations}ARCHITECTURE.md, "
    [ -f "IMPLEMENTATION.md" ] && locations="${locations}IMPLEMENTATION.md, "

    # Trim trailing ", "
    locations="${locations%, }"

    if [ -z "$locations" ]; then
        echo "docs/ directory (create it if needed)"
    else
        echo "$locations"
    fi
}

DOCS_LOCATION=$(find_docs_locations)

cat <<EOF
{
    "decision": "block",
    "reason": "Before finishing, review all the code changes you made in this session. Determine if any significant changes occurred — such as architectural changes, new or modified features, updated flows, API changes, or meaningful implementation changes. If significant changes were made, update the project's implementation documentation (located at: ${DOCS_LOCATION}) to reflect them accurately. Keep the documentation structure and style consistent with what already exists. If no significant changes occurred (e.g., only minor bug fixes, typo corrections, formatting, or config tweaks), no documentation update is needed. After your review — whether or not you updated documentation — you MUST include the exact marker phrase 'DOCS_REVIEW_COMPLETE' in your response so the hook knows you've completed the review."
}
EOF
