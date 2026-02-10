#!/bin/bash

# Medical AI Assistant - Comprehensive API Route Testing Script
# This script tests all backend API routes systematically

BASE_URL="http://localhost:8080"
RESULTS_FILE="/tmp/route_test_results.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize results file
echo "Medical AI Assistant - API Route Testing Results" > $RESULTS_FILE
echo "Test Date: $(date)" >> $RESULTS_FILE
echo "========================================" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Function to test a route
test_route() {
    local method=$1
    local path=$2
    local description=$3
    local data=$4
    local auth=$5
    
    echo -n "Testing: $method $path ... "
    
    if [ "$method" == "GET" ]; then
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Basic $auth" "$BASE_URL$path" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" "$BASE_URL$path" 2>&1)
        fi
    elif [ "$method" == "POST" ]; then
        if [ -n "$data" ]; then
            if [ -n "$auth" ]; then
                response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Basic $auth" -d "$data" "$BASE_URL$path" 2>&1)
            else
                response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$path" 2>&1)
            fi
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$path" 2>&1)
        fi
    elif [ "$method" == "PUT" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -H "Authorization: Basic $auth" -d "$data" "$BASE_URL$path" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X PUT -H "Authorization: Basic $auth" "$BASE_URL$path" 2>&1)
        fi
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Authorization: Basic $auth" "$BASE_URL$path" 2>&1)
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    # Determine result
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✓ PASS${NC} ($status_code)"
        echo "✓ PASS - $method $path - $description (Status: $status_code)" >> $RESULTS_FILE
    elif [[ "$status_code" =~ ^401$ ]] || [[ "$status_code" =~ ^403$ ]]; then
        echo -e "${YELLOW}⚠ AUTH REQUIRED${NC} ($status_code)"
        echo "⚠ AUTH - $method $path - $description (Status: $status_code - Authentication Required)" >> $RESULTS_FILE
    elif [[ "$status_code" =~ ^404$ ]]; then
        echo -e "${YELLOW}⚠ NOT FOUND${NC} ($status_code)"
        echo "⚠ 404 - $method $path - $description (Status: $status_code - Resource Not Found)" >> $RESULTS_FILE
    elif [[ "$status_code" =~ ^422$ ]]; then
        echo -e "${YELLOW}⚠ VALIDATION ERROR${NC} ($status_code)"
        echo "⚠ VALIDATION - $method $path - $description (Status: $status_code - Invalid Input)" >> $RESULTS_FILE
    elif [[ "$status_code" =~ ^500$ ]] || [[ "$status_code" =~ ^503$ ]]; then
        echo -e "${RED}✗ FAIL${NC} ($status_code)"
        echo "✗ FAIL - $method $path - $description (Status: $status_code - Server Error)" >> $RESULTS_FILE
        echo "  Error: $body" >> $RESULTS_FILE
    else
        echo -e "${YELLOW}? UNKNOWN${NC} ($status_code)"
        echo "? UNKNOWN - $method $path - $description (Status: $status_code)" >> $RESULTS_FILE
    fi
}

echo "========================================="
echo "  Medical AI Assistant API Route Testing"
echo "========================================="
echo ""

# 1. HEALTH & INFO ROUTES
echo -e "\n${YELLOW}[1/15] Testing Health & Info Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== HEALTH & INFO ROUTES ===" >> $RESULTS_FILE
test_route "GET" "/" "Root endpoint"
test_route "GET" "/health" "Basic health check"
test_route "GET" "/health/detailed" "Detailed health check"
test_route "GET" "/api/v1/info" "API information"
test_route "GET" "/metrics" "Prometheus metrics"

# 2. AUTHENTICATION ROUTES
echo -e "\n${YELLOW}[2/15] Testing Authentication Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== AUTHENTICATION ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/auth/signup" "User signup" '{"email":"test@example.com","password":"Test123!","name":"Test User","role":"PATIENT"}'
test_route "POST" "/api/v1/auth/login" "User login" '{"username":"test@example.com","password":"Test123!"}'
test_route "POST" "/api/v1/auth/token" "Get token" '{"username":"test@example.com","password":"Test123!"}'
test_route "GET" "/api/v1/auth/me" "Get current user"
test_route "POST" "/api/v1/auth/verify-email" "Verify email" '{"email":"test@example.com","otp":"123456"}'
test_route "POST" "/api/v1/auth/forgot-password" "Forgot password" '{"email":"test@example.com"}'
test_route "POST" "/api/v1/auth/reset-password" "Reset password" '{"token":"dummy","new_password":"NewPass123!"}'
test_route "GET" "/api/v1/auth/debug-token" "Debug token"

# 3. CHAT ROUTES
echo -e "\n${YELLOW}[3/15] Testing Chat Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== CHAT ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/chat/chat" "Send chat message" '{"query":"What are symptoms of diabetes?"}'
test_route "POST" "/api/v1/chat/chat/stream" "Streaming chat"
test_route "GET" "/api/v1/chat/history" "Get chat history"
test_route "DELETE" "/api/v1/chat/history" "Clear chat history"
test_route "GET" "/api/v1/chat/suggestions" "Get suggestions"
test_route "GET" "/api/v1/chat/followup" "Get followup questions"
test_route "POST" "/api/v1/chat/analyze" "Analyze conversation"
test_route "GET" "/api/v1/chat/health" "Chat service health"
test_route "DELETE" "/api/v1/chat/memory" "Clear memory"

# 4. DOCUMENT ROUTES
echo -e "\n${YELLOW}[4/15] Testing Document Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== DOCUMENT ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/docs/upload_docs" "Upload document"
test_route "GET" "/api/v1/vector/stats" "Vector store stats"

# 5. APPOINTMENTS ROUTES
echo -e "\n${YELLOW}[5/15] Testing Appointments Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== APPOINTMENTS ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/appointments/slots" "Create appointment slot"
test_route "GET" "/api/v1/appointments/slots" "Get available slots"
test_route "POST" "/api/v1/appointments/" "Book appointment"
test_route "GET" "/api/v1/appointments/" "List appointments"
test_route "PUT" "/api/v1/appointments/dummy-id" "Update appointment"
test_route "GET" "/api/v1/appointments/dummy-id/join" "Join appointment"
test_route "POST" "/api/v1/appointments/dummy-id/prescribe" "Create prescription"
test_route "GET" "/api/v1/appointments/dummy-id/prescriptions" "Get prescriptions"

# 6. GROUPS ROUTES
echo -e "\n${YELLOW}[6/15] Testing Groups Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== GROUPS ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/groups/" "Create group"
test_route "GET" "/api/v1/groups/" "List groups"
test_route "GET" "/api/v1/groups/dummy-id" "Get group details"
test_route "DELETE" "/api/v1/groups/dummy-id" "Delete group"
test_route "PUT" "/api/v1/groups/dummy-id/settings" "Update group settings"
test_route "GET" "/api/v1/groups/dummy-id/members" "Get group members"
test_route "POST" "/api/v1/groups/dummy-id/members/user-id" "Add member"
test_route "DELETE" "/api/v1/groups/dummy-id/members/user-id" "Remove member"
test_route "PUT" "/api/v1/groups/dummy-id/members/user-id/ban" "Ban member"
test_route "PUT" "/api/v1/groups/dummy-id/members/user-id/unban" "Unban member"
test_route "GET" "/api/v1/groups/dummy-id/messages" "Get messages"
test_route "POST" "/api/v1/groups/dummy-id/messages" "Send message"
test_route "PUT" "/api/v1/groups/dummy-id/messages/msg-id" "Edit message"
test_route "DELETE" "/api/v1/groups/dummy-id/messages/msg-id" "Delete message"
test_route "POST" "/api/v1/groups/dummy-id/messages/msg-id/react" "React to message"
test_route "DELETE" "/api/v1/groups/dummy-id/messages/msg-id/react" "Remove reaction"
test_route "GET" "/api/v1/groups/dummy-id/moderation-logs" "Get moderation logs"

# 7. LIBRARY ROUTES
echo -e "\n${YELLOW}[7/15] Testing Library Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== LIBRARY ROUTES ===" >> $RESULTS_FILE
test_route "GET" "/api/v1/library/content" "Get library content"
test_route "POST" "/api/v1/library/content" "Add content"
test_route "POST" "/api/v1/library/recommend" "Recommend content"
test_route "GET" "/api/v1/library/my-recommendations" "Get my recommendations"
test_route "GET" "/api/v1/library/quiz/content-id" "Get quiz"
test_route "POST" "/api/v1/library/quiz/content-id/submit" "Submit quiz"

# 8. WELLNESS ROUTES
echo -e "\n${YELLOW}[8/15] Testing Wellness Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== WELLNESS ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/wellness/mood" "Log mood"
test_route "GET" "/api/v1/wellness/mood/history" "Get mood history"
test_route "POST" "/api/v1/wellness/journal" "Create journal entry"
test_route "GET" "/api/v1/wellness/journal" "Get journal entries"
test_route "DELETE" "/api/v1/wellness/journal/entry-id" "Delete journal entry"

# 9. STORIES ROUTES
echo -e "\n${YELLOW}[9/15] Testing Stories Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== STORIES ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/stories/" "Create story"
test_route "GET" "/api/v1/stories/" "Get stories feed"
test_route "GET" "/api/v1/stories/user-id" "Get user stories"
test_route "POST" "/api/v1/stories/story-id/view" "View story"
test_route "DELETE" "/api/v1/stories/story-id" "Delete story"

# 10. PROFILES ROUTES
echo -e "\n${YELLOW}[10/15] Testing Profiles Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== PROFILES ROUTES ===" >> $RESULTS_FILE
test_route "GET" "/api/v1/profiles/user-id" "Get user profile"
test_route "PUT" "/api/v1/profiles/me" "Update my profile"
test_route "POST" "/api/v1/profiles/me/avatar" "Upload avatar"
test_route "POST" "/api/v1/profiles/user-id/follow" "Follow user"
test_route "DELETE" "/api/v1/profiles/user-id/follow" "Unfollow user"
test_route "GET" "/api/v1/profiles/user-id/followers" "Get followers"
test_route "GET" "/api/v1/profiles/user-id/following" "Get following"

# 11. CLINICAL ROUTES
echo -e "\n${YELLOW}[11/15] Testing Clinical Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== CLINICAL ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/clinical/notes" "Create clinical note"
test_route "GET" "/api/v1/clinical/notes/patient-id" "Get clinical notes"
test_route "POST" "/api/v1/clinical/prescriptions" "Create prescription"
test_route "GET" "/api/v1/clinical/prescriptions/patient-id" "Get prescriptions"
test_route "GET" "/api/v1/clinical/patients/patient-id" "Get patient records"

# 12. ANALYTICS ROUTES
echo -e "\n${YELLOW}[12/15] Testing Analytics Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== ANALYTICS ROUTES ===" >> $RESULTS_FILE
test_route "GET" "/api/v1/analytics/stats" "Get system statistics"
test_route "GET" "/api/v1/analytics/logs" "Get analytics logs"
test_route "GET" "/api/v1/analytics/clinical/summary/patient-id" "Get clinical summary"
test_route "GET" "/api/v1/analytics/clinical/trends" "Get clinical trends"
test_route "GET" "/api/v1/analytics/clinical/success" "Get success metrics"
test_route "POST" "/api/v1/analytics/clinical/analyze-risk" "Analyze risk"

# 13. ADMIN ROUTES
echo -e "\n${YELLOW}[13/15] Testing Admin Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== ADMIN ROUTES ===" >> $RESULTS_FILE
test_route "GET" "/api/v1/admin/users" "List users"
test_route "POST" "/api/v1/admin/users" "Create user"
test_route "GET" "/api/v1/admin/users/user-id" "Get user"
test_route "PUT" "/api/v1/admin/users/user-id" "Update user"
test_route "DELETE" "/api/v1/admin/users/user-id" "Delete user"
test_route "PUT" "/api/v1/admin/users/user-id/role" "Update user role"
test_route "GET" "/api/v1/admin/users/lookup" "Lookup user"
test_route "GET" "/api/v1/admin/doctors/doctor-id" "Get doctor details"
test_route "GET" "/api/v1/admin/organizations/me" "Get my organization"
test_route "GET" "/api/v1/admin/organizations/org-id/details" "Get org details"
test_route "GET" "/api/v1/admin/organizations/org-id/members" "Get org members"
test_route "DELETE" "/api/v1/admin/organizations/org-id" "Delete organization"
test_route "PUT" "/api/v1/admin/organizations/org-id/transfer-ownership" "Transfer ownership"
test_route "GET" "/api/v1/admin/requests/delete" "Get delete requests"
test_route "POST" "/api/v1/admin/requests/delete/req-id/approve" "Approve delete request"
test_route "POST" "/api/v1/admin/requests/delete/req-id/reject" "Reject delete request"
test_route "GET" "/api/v1/admin/logs/system" "Get system logs"

# 14. ONBOARDING ROUTES
echo -e "\n${YELLOW}[14/15] Testing Onboarding Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== ONBOARDING ROUTES ===" >> $RESULTS_FILE
test_route "GET" "/api/v1/onboarding/status" "Get onboarding status"
test_route "POST" "/api/v1/onboarding/patient/profile" "Create patient profile"
test_route "POST" "/api/v1/onboarding/doctor/profile" "Create doctor profile"
test_route "GET" "/api/v1/onboarding/doctor/links" "Get doctor links"
test_route "POST" "/api/v1/onboarding/links/request" "Request link"
test_route "PUT" "/api/v1/onboarding/links/link-id/status" "Update link status"
test_route "POST" "/api/v1/onboarding/organizations" "Create organization"
test_route "GET" "/api/v1/onboarding/organizations" "List organizations"
test_route "GET" "/api/v1/onboarding/organizations/me" "Get my organization"
test_route "PUT" "/api/v1/onboarding/organizations/me" "Update my organization"
test_route "GET" "/api/v1/onboarding/organizations/org-id/doctors" "Get org doctors"
test_route "PUT" "/api/v1/onboarding/admin/organizations/org-id/verify" "Verify organization"
test_route "POST" "/api/v1/onboarding/org/invite" "Invite to organization"
test_route "GET" "/api/v1/onboarding/org/doctor-requests" "Get doctor requests"
test_route "PUT" "/api/v1/onboarding/org/doctor-requests/doc-id/status" "Update doctor request"
test_route "GET" "/api/v1/onboarding/org/pending-patients" "Get pending patients"
test_route "PUT" "/api/v1/onboarding/org/approve-patient/patient-id" "Approve patient"

# 15. MEDIA ROUTES
echo -e "\n${YELLOW}[15/15] Testing Media Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== MEDIA ROUTES ===" >> $RESULTS_FILE
test_route "POST" "/api/v1/media/upload" "Upload media"
test_route "GET" "/api/v1/media/images/file.jpg" "Get image"
test_route "DELETE" "/api/v1/media/images/file.jpg" "Delete media"
test_route "GET" "/api/v1/media/images/thumbnails/file.jpg" "Get thumbnail"
test_route "GET" "/api/v1/media/groups/group-id/gallery" "Get group gallery"

# 16. NOTIFICATIONS ROUTES
echo -e "\n${YELLOW}[16/16] Testing Notifications Routes${NC}"
echo "" >> $RESULTS_FILE
echo "=== NOTIFICATIONS ROUTES ===" >> $RESULTS_FILE
test_route "GET" "/api/v1/notifications/" "List notifications"
test_route "PUT" "/api/v1/notifications/notif-id/read" "Mark as read"

echo ""
echo "========================================="
echo "  Testing Complete!"
echo "========================================="
echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""

# Generate summary
echo "" >> $RESULTS_FILE
echo "========================================" >> $RESULTS_FILE
echo "SUMMARY" >> $RESULTS_FILE
echo "========================================" >> $RESULTS_FILE

pass_count=$(grep -c "✓ PASS" $RESULTS_FILE || echo "0")
auth_count=$(grep -c "⚠ AUTH" $RESULTS_FILE || echo "0")
not_found_count=$(grep -c "⚠ 404" $RESULTS_FILE || echo "0")
validation_count=$(grep -c "⚠ VALIDATION" $RESULTS_FILE || echo "0")
fail_count=$(grep -c "✗ FAIL" $RESULTS_FILE || echo "0")
total_count=$((pass_count + auth_count + not_found_count + validation_count + fail_count))

echo "Total Routes Tested: $total_count" >> $RESULTS_FILE
echo "✓ Passed: $pass_count" >> $RESULTS_FILE
echo "⚠ Auth Required: $auth_count" >> $RESULTS_FILE
echo "⚠ Not Found (404): $not_found_count" >> $RESULTS_FILE
echo "⚠ Validation Errors: $validation_count" >> $RESULTS_FILE
echo "✗ Failed: $fail_count" >> $RESULTS_FILE

echo -e "${GREEN}Total Routes Tested: $total_count${NC}"
echo -e "${GREEN}✓ Passed: $pass_count${NC}"
echo -e "${YELLOW}⚠ Auth Required: $auth_count${NC}"
echo -e "${YELLOW}⚠ Not Found (404): $not_found_count${NC}"
echo -e "${YELLOW}⚠ Validation Errors: $validation_count${NC}"
echo -e "${RED}✗ Failed: $fail_count${NC}"
