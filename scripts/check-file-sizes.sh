#!/bin/bash

# File size monitoring script for maintaining Claude-friendly file sizes
# Exits with failure if any file exceeds the "large file" threshold

set -e

# Thresholds based on Claude's working limits
OPTIMAL_LINES=500
OPTIMAL_CHARS=20000
MANAGEABLE_LINES=1000
MANAGEABLE_CHARS=40000

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Track if any files are too large
has_large_files=false
has_warnings=false

echo "🔍 Checking source file sizes for Claude compatibility..."
echo ""

# Function to check a single file
check_file() {
    local file="$1"
    local lines=$(wc -l < "$file")
    local chars=$(wc -c < "$file")
    
    # Determine status
    local status="✅ OPTIMAL"
    local color="$GREEN"
    
    if [ "$lines" -gt "$MANAGEABLE_LINES" ] || [ "$chars" -gt "$MANAGEABLE_CHARS" ]; then
        status="❌ TOO LARGE"
        color="$RED"
        has_large_files=true
    elif [ "$lines" -gt "$OPTIMAL_LINES" ] || [ "$chars" -gt "$OPTIMAL_CHARS" ]; then
        status="⚠️  MANAGEABLE"
        color="$YELLOW"
        has_warnings=true
    fi
    
    printf "${color}%-15s${NC} %4d lines, %6d chars - %s\n" "$status" "$lines" "$chars" "$file"
}

# Find and check all source files
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | sort | while read -r file; do
    check_file "$file"
done

echo ""

# Summary and exit status
if [ "$has_large_files" = true ]; then
    echo -e "${RED}❌ FAILURE: Some files exceed Claude's large file threshold!${NC}"
    echo ""
    echo "Files over ${MANAGEABLE_LINES} lines or ${MANAGEABLE_CHARS} characters should be split."
    echo "Consider breaking large files into smaller, focused modules."
    echo ""
    echo "Thresholds:"
    echo "  ✅ Optimal:    ≤${OPTIMAL_LINES} lines, ≤${OPTIMAL_CHARS} chars"
    echo "  ⚠️  Manageable: ≤${MANAGEABLE_LINES} lines, ≤${MANAGEABLE_CHARS} chars"
    echo "  ❌ Too Large:  >${MANAGEABLE_LINES} lines or >${MANAGEABLE_CHARS} chars"
    exit 1
elif [ "$has_warnings" = true ]; then
    echo -e "${YELLOW}⚠️  WARNING: Some files are approaching size limits${NC}"
    echo "Consider splitting files before they become too large for Claude to handle efficiently."
    echo ""
else
    echo -e "${GREEN}✅ All files are within optimal size ranges for Claude!${NC}"
    echo ""
fi

echo "File size check complete."
exit 0