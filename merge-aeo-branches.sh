#!/bin/bash
set -e
cd ~/clearlegacy-site

echo "=== Cleaning up any stuck state ==="
git merge --abort 2>/dev/null || true
git stash 2>/dev/null || true

echo "=== Checking out main ==="
git checkout main
git pull origin main

echo ""
echo "=== Merging Quick Answers + FAQs branch ==="
git merge origin/claude/awesome-bhabha-62f220 --no-edit
echo "Done: Quick Answers + FAQs merged"

echo ""
echo "=== Merging Unmarried Partner Cluster branch ==="
git merge origin/claude/ecstatic-cori-749882 --no-edit
echo "Done: Unmarried Partner Cluster merged"

echo ""
if git branch -r | grep -q "origin/claude/.*author\|origin/claude/.*reviewer\|origin/claude/.*trust"; then
    AUTHOR_BRANCH=$(git branch -r | grep -E "origin/claude/.*(author|reviewer|trust)" | head -1 | xargs)
    echo "=== Found author/reviewer branch: $AUTHOR_BRANCH ==="
    git merge "$AUTHOR_BRANCH" --no-edit
    echo "Done: Author/reviewer pages merged"
else
    echo "No author/reviewer branch found on origin — skipping"
fi

echo ""
echo "=== Pushing main ==="
git push origin main
echo ""
echo "All done — GitHub Pages will deploy automatically"
