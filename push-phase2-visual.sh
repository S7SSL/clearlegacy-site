#!/bin/bash
set -e

WORKTREE="/Users/marge/clearlegacy-site/.claude/worktrees/gallant-lamarr-db4ccc"
MAIN="/Users/marge/clearlegacy-site"

echo "=== Checking worktree status ==="
cd "$WORKTREE"
git status --short

echo ""
echo "=== Committing any uncommitted changes in worktree ==="
git add -A
git commit -m "Phase 2: visual guides, stats hub, estate risk assessment, homepage improvements" 2>/dev/null || echo "(already committed)"

echo ""
echo "=== Getting branch name ==="
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Branch: $BRANCH"

echo ""
echo "=== Pushing branch to origin ==="
git push origin "$BRANCH" 2>/dev/null || git push --set-upstream origin "$BRANCH"

echo ""
echo "=== Switching to main and merging ==="
cd "$MAIN"
git checkout main
git pull origin main
git merge "origin/$BRANCH" --no-edit
echo ""
echo "=== Pushing main ==="
git push origin main

echo ""
echo "Done - GitHub Pages will deploy automatically"
