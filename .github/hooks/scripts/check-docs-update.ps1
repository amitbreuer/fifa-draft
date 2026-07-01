# ============================================================================
# Copilot CLI agentStop Hook — Auto-update project documentation (Windows)
# ============================================================================
# PowerShell equivalent of check-docs-update.sh for Windows compatibility.
# ============================================================================

$ErrorActionPreference = "Stop"

# Read JSON input from stdin
$input_json = $input | Out-String
$data = $input_json | ConvertFrom-Json

# Extract transcript path
$transcriptPath = if ($data.transcriptPath) { $data.transcriptPath } elseif ($data.transcript_path) { $data.transcript_path } else { "" }

# --- Check 1: Was docs review already completed? ---
if ($transcriptPath -and (Test-Path $transcriptPath)) {
    $content = Get-Content $transcriptPath -Raw -ErrorAction SilentlyContinue
    if ($content -match "DOCS_REVIEW_COMPLETE") {
        Write-Output '{"decision": "allow"}'
        exit 0
    }
}

# --- Check 2: Were any meaningful code changes made? ---
$changedFiles = @()
try {
    $changedFiles += (git diff --name-only HEAD 2>$null) -split "`n"
    $changedFiles += (git diff --cached --name-only 2>$null) -split "`n"
    $changedFiles += (git diff --name-only 2>$null) -split "`n"
    $changedFiles += (git ls-files --others --exclude-standard 2>$null) -split "`n"
} catch {}

$changedFiles = $changedFiles | Where-Object { $_ -ne "" } | Sort-Object -Unique

if ($changedFiles.Count -eq 0) {
    Write-Output '{"decision": "allow"}'
    exit 0
}

# Filter out documentation/config-only changes
$docPatterns = @(
    '^\.(github|vscode|idea|claude|cursor|copilot)/',
    '^docs/',
    '^\.copilot',
    '^README\.md$',
    '^DOCUMENTATION\.md$',
    '^CHANGELOG\.md$',
    '^LICENSE',
    '^\.gitignore$',
    '^\.editorconfig$',
    '^\.prettierrc',
    '^\.eslintrc',
    '\.lock$'
)
$combinedPattern = ($docPatterns -join "|")

$codeFiles = $changedFiles | Where-Object { $_ -notmatch $combinedPattern }

if ($codeFiles.Count -eq 0) {
    Write-Output '{"decision": "allow"}'
    exit 0
}

# --- Detect documentation locations ---
$locations = @()
if (Test-Path "docs") { $locations += "docs/ directory" }
if (Test-Path "DOCUMENTATION.md") { $locations += "DOCUMENTATION.md" }
if (Test-Path "ARCHITECTURE.md") { $locations += "ARCHITECTURE.md" }
if (Test-Path "IMPLEMENTATION.md") { $locations += "IMPLEMENTATION.md" }

if ($locations.Count -eq 0) {
    $docsLocation = "docs/ directory (create it if needed)"
} else {
    $docsLocation = $locations -join ", "
}

# --- Block: Force the agent to review and update docs ---
$reason = "Before finishing, review all the code changes you made in this session. Determine if any significant changes occurred - such as architectural changes, new or modified features, updated flows, API changes, or meaningful implementation changes. If significant changes were made, update the project's implementation documentation (located at: $docsLocation) to reflect them accurately. Keep the documentation structure and style consistent with what already exists. If no significant changes occurred (e.g., only minor bug fixes, typo corrections, formatting, or config tweaks), no documentation update is needed. After your review - whether or not you updated documentation - you MUST include the exact marker phrase 'DOCS_REVIEW_COMPLETE' in your response so the hook knows you've completed the review."

$output = @{
    decision = "block"
    reason = $reason
} | ConvertTo-Json -Compress

Write-Output $output
