#!/bin/bash
# Automated Push Subscription Cleanup and Fresh Registration

echo "🧹 PUSH NOTIFICATION SUBSCRIPTION CLEANUP SCRIPT"
echo "=================================================="
echo ""
echo "This script will:"
echo "1. Delete ALL old push subscriptions from database"
echo "2. Force you to register a fresh subscription"
echo "3. Test the new subscription"
echo ""
echo "⚠️  WARNING: All old subscriptions will be deleted!"
echo ""

# Step 1: Ask user to delete in Supabase
echo "📝 STEP 1: Delete old subscriptions"
echo "-----------------------------------"
echo "1. Open: https://app.supabase.com"
echo "2. Go to: SQL Editor"
echo "3. Run this SQL:"
echo ""
echo "    DELETE FROM push_subscriptions;"
echo "    SELECT COUNT(*) FROM push_subscriptions;"
echo ""
echo "4. Should show: 0"
echo ""
echo "Press ENTER when done..."
read

# Step 2: Clear browser storage
echo ""
echo "📝 STEP 2: Clear browser storage"
echo "--------------------------------"
echo "1. Go to: http://localhost:5174/"
echo "2. Press: F12 (DevTools)"
echo "3. Go to: Application → Service Workers"
echo "4. Click: 'Unregister' for /sw.js"
echo "5. Go to: Application → Local Storage"
echo "6. Delete: localStorage items"
echo "7. Hard refresh: Ctrl+Shift+R"
echo ""
echo "Press ENTER when done..."
read

# Step 3: Re-enable notifications
echo ""
echo "📝 STEP 3: Enable fresh notifications"
echo "-------------------------------------"
echo "1. Click: Bell icon (🔔 Notifications)"
echo "2. Click: Enable"
echo "3. Allow: Notifications when browser prompts"
echo "4. Wait: For 'Notifications On' to appear (green)"
echo ""
echo "Press ENTER when done..."
read

# Step 4: Test notification
echo ""
echo "📝 STEP 4: Test notification from admin"
echo "--------------------------------------"
echo "1. Click: Admin"
echo "2. Enter password: edu51five2025"
echo "3. Scroll to: 📢 Broadcast Push Notification"
echo "4. Enter:"
echo "   Title: Fresh Subscription Test"
echo "   Body: If you see this, it works!"
echo "5. Click: 🚀 Send to All Subscribers"
echo "6. Minimize browser"
echo "7. Check: Bottom-right corner for notification"
echo ""
echo "✅ If you see the notification, PUSH NOTIFICATIONS ARE WORKING!"
echo ""
