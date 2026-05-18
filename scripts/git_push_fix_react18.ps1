#!/usr/bin/env pwsh
Param(
  [string]$Branch = "fix/react18",
  [string]$CommitMessage = "chore: downgrade to React 18 and set node engine to 18.x for CRA compatibility"
)

Write-Host "Running git push script in: $PWD"

# Ensure Git is available
try {
  git --version | Out-Null
} catch {
  Write-Error "Git does not appear to be installed or not in PATH. Install Git from https://git-scm.com/downloads and retry."
  exit 1
}

# Move to repository root (script location)
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)

# Optional: verify we are in the repo
if (-not (Test-Path ".git")) {
  Write-Warning "No .git folder found in current directory. Are you running this from the repository root?"
}

# Fetch latest
git fetch origin

# Create branch
$branchExists = (git rev-parse --verify --quiet $Branch) -ne $null
if ($branchExists) {
  Write-Host "Branch '$Branch' already exists locally. Checking it out."
  git checkout $Branch
} else {
  git checkout -b $Branch
}

# Stage and commit
git add frontend/package.json
$hasChanges = git diff --cached --name-only | Select-String -Pattern '.' -Quiet
if (-not $hasChanges) {
  Write-Host "No staged changes to commit. There may be nothing to commit or changes are already committed."
} else {
  git commit -m "$CommitMessage"
}

# Push
git push -u origin $Branch

Write-Host "Done. If push succeeded, visit GitHub to create a PR from '$Branch' to your main branch if desired."