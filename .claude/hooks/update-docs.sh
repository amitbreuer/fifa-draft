#!/bin/bash
set -uo pipefail

# Flag file breaks the Stop loop: first invocation blocks + sets flag,
# second invocation (after Claude updates/skips docs) approves + clears flag.
FLAG="${CLAUDE_PROJECT_DIR}/.claude/.doc-hook-processed"

if [ -f "$FLAG" ]; then
  rm -f "$FLAG"
  exit 0
fi

# Collect uncommitted changed files
diff_names=$(git -C "$CLAUDE_PROJECT_DIR" diff HEAD --name-only 2>/dev/null || echo "")

if [ -z "$diff_names" ]; then
  exit 0
fi

# Only proceed if non-doc files changed (avoid triggering when only .md files were edited)
code_changes=$(echo "$diff_names" | grep -v '\.md$' || true)

if [ -z "$code_changes" ]; then
  exit 0
fi

# Get a bounded diff for context (150 lines to avoid overwhelming Claude)
diff_output=$(git -C "$CLAUDE_PROJECT_DIR" diff HEAD -- $(echo "$code_changes" | tr '\n' ' ') 2>/dev/null | head -n 150)

touch "$FLAG"

system_message="Files changed this session:
$(echo "$code_changes" | sed 's/^/  - /')

Diff (first 150 lines):
\`\`\`diff
${diff_output}
\`\`\`

Before stopping: determine if these changes are architecturally or functionally significant — new/changed API routes, DB schema changes, new features, different user flows. If yes, update the relevant documentation file(s). If the changes are minor (bug fixes, refactoring with identical behavior, styling), stop immediately without touching the docs."

jq -n \
  --arg decision "block" \
  --arg reason "Reviewing changes to determine if documentation needs updating" \
  --arg msg "$system_message" \
  '{"decision": $decision, "reason": $reason, "systemMessage": $msg}'
