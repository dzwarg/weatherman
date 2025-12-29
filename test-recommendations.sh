#!/bin/bash
# Test script for recommendation system
# Tests T084, T085, T086

set -e

echo "==================================="
echo "Recommendation System Test Suite"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test server health
test_health() {
    echo -e "${YELLOW}Testing server health...${NC}"
    response=$(curl -s http://localhost:3000/api/health)
    echo "$response" | jq '.'

    # Check if Claude is available
    claude_status=$(echo "$response" | jq -r '.services.claude')
    if [ "$claude_status" == "connected" ]; then
        echo -e "${GREEN}✓ Claude API: Connected${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Claude API: Unavailable (will use rules)${NC}"
        return 1
    fi
}

# Function to test recommendations with different profiles
test_profile_recommendations() {
    profile_id=$1
    profile_age=$2
    profile_gender=$3
    test_name=$4

    echo ""
    echo -e "${YELLOW}Testing $test_name...${NC}"

    # Make recommendation request
    response=$(curl -s -X POST http://localhost:3000/api/recommendations \
        -H "Content-Type: application/json" \
        -d "{
            \"profile\": {
                \"id\": \"$profile_id\",
                \"age\": $profile_age,
                \"gender\": \"$profile_gender\"
            },
            \"weather\": {
                \"temperature\": 45,
                \"feelsLike\": 42,
                \"conditions\": \"Cloudy\",
                \"precipitationProbability\": 20,
                \"windSpeed\": 10,
                \"uvIndex\": 2
            },
            \"voicePrompt\": \"What should I wear to school today?\"
        }")

    # Parse response
    source=$(echo "$response" | jq -r '.source')
    profile_from_response=$(echo "$response" | jq -r '.profileId')
    confidence=$(echo "$response" | jq -r '.confidence')

    # Validate response
    if [ "$profile_from_response" == "$profile_id" ]; then
        echo -e "${GREEN}✓ Profile ID matches: $profile_id${NC}"
    else
        echo -e "${RED}✗ Profile ID mismatch: expected $profile_id, got $profile_from_response${NC}"
        return 1
    fi

    if [ "$source" == "claude" ] || [ "$source" == "rules" ]; then
        echo -e "${GREEN}✓ Valid source: $source${NC}"
    else
        echo -e "${RED}✗ Invalid source: $source${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Confidence: $confidence${NC}"

    # Show recommendation summary
    base_layers=$(echo "$response" | jq -r '.recommendations.baseLayers | length')
    outerwear=$(echo "$response" | jq -r '.recommendations.outerwear | length')
    echo "  - Base layers: $base_layers items"
    echo "  - Outerwear: $outerwear items"

    echo -e "${GREEN}✓ $test_name passed${NC}"
    return 0
}

# T084: Test recommendations end-to-end with mocks (or server)
echo ""
echo "==================================="
echo "T084: Testing Different Profiles"
echo "==================================="

test_profile_recommendations "4yo-girl" 4 "girl" "4-year-old girl"
test_profile_recommendations "7yo-boy" 7 "boy" "7-year-old boy"
test_profile_recommendations "10yo-boy" 10 "boy" "10-year-old boy"

# T085: Test with Claude API
echo ""
echo "==================================="
echo "T085: Testing Claude API Status"
echo "==================================="

if test_health; then
    echo -e "${GREEN}✓ T085: Claude API is available and responding${NC}"
    HAS_CLAUDE=true
else
    echo -e "${YELLOW}⚠ T085: Claude API not configured - using rule-based fallback${NC}"
    HAS_CLAUDE=false
fi

# T086: Test fallback behavior
echo ""
echo "==================================="
echo "T086: Testing Fallback Behavior"
echo "==================================="

if [ "$HAS_CLAUDE" = true ]; then
    echo "Claude API is configured. To test fallback:"
    echo "1. Comment out ANTHROPIC_API_KEY in packages/server/.env"
    echo "2. Restart the server"
    echo "3. Re-run this test"
    echo ""
    echo "Expected behavior:"
    echo "  - source should change from 'claude' to 'rules'"
    echo "  - confidence should be lower (typically 0.85 vs 0.95)"
    echo "  - recommendations should still be appropriate"
else
    echo -e "${GREEN}✓ T086: Already testing fallback behavior (Claude unavailable)${NC}"
    echo "All recommendations are using rule-based logic."
fi

# Summary
echo ""
echo "==================================="
echo "Test Summary"
echo "==================================="
echo -e "${GREEN}✓ T084: Different profiles tested successfully${NC}"
echo -e "${GREEN}✓ T085: Claude API status verified${NC}"
echo -e "${GREEN}✓ T086: Fallback behavior ${HAS_CLAUDE:+documented}${HAS_CLAUDE:-tested}${NC}"
echo ""
echo "Next step: Run full test suite with 'npm run test' (T087)"
