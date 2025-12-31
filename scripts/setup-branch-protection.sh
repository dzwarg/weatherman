#!/bin/bash
#
# Setup Branch Protection Rules for main branch
#
# This script configures GitHub branch protection rules to enforce
# quality gates before merging pull requests to main.
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Admin access to the repository
#
# Usage:
#   ./scripts/setup-branch-protection.sh

set -e

REPO="dzwarg/weatherman"
BRANCH="main"

echo "🔒 Setting up branch protection for $REPO:$BRANCH"
echo ""

# Required status checks that must pass before merging
REQUIRED_CHECKS=(
  "Validate Branch Name"
  "Check Deployment Status"
  "Validate Commit Messages"
  "Run CI Checks"
  "Calculate Coverage"
  "Quality Gate Summary"
)

echo "📋 Required status checks:"
for check in "${REQUIRED_CHECKS[@]}"; do
  echo "  ✓ $check"
done
echo ""

# Create JSON payload
cat > /tmp/branch-protection.json <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Validate Branch Name",
      "Check Deployment Status",
      "Validate Commit Messages",
      "Run CI Checks",
      "Calculate Coverage",
      "Quality Gate Summary"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

echo "⚙️  Applying branch protection rules..."
if gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  --input /tmp/branch-protection.json > /dev/null 2>&1; then
  echo "✅ Branch protection rules applied successfully!"
else
  echo "❌ Failed to apply branch protection rules"
  echo ""
  echo "This may happen if:"
  echo "  1. You don't have admin access to the repository"
  echo "  2. GitHub CLI is not authenticated"
  echo "  3. The branch doesn't exist yet"
  echo ""
  echo "You can manually configure these settings in GitHub:"
  echo "  https://github.com/$REPO/settings/branches"
  echo ""
  echo "Required settings:"
  echo "  ✓ Require status checks to pass before merging"
  echo "  ✓ Require branches to be up to date before merging"
  echo "  ✓ Status checks that are required:"
  for check in "${REQUIRED_CHECKS[@]}"; do
    echo "    - $check"
  done
  echo "  ✓ Require conversation resolution before merging"
  echo "  ✓ Do not allow bypassing the above settings"
  exit 1
fi

rm -f /tmp/branch-protection.json

echo ""
echo "📖 Branch protection is now active. Pull requests to main must:"
echo "  1. Have a valid branch name (NNN-feature-description format)"
echo "  2. Not conflict with active deployments"
echo "  3. Have conventional commit messages"
echo "  4. Pass all CI checks (lint, test, build)"
echo "  5. Meet 80% code coverage threshold"
echo "  6. Have all conversations resolved"
echo ""
echo "🎉 Setup complete!"
