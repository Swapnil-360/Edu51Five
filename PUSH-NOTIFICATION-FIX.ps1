# Push Notification Subscription Cleanup - Windows PowerShell

Write-Host "🧹 PUSH NOTIFICATION SUBSCRIPTION CLEANUP SCRIPT" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Delete old subscriptions and force fresh registration" -ForegroundColor Yellow
Write-Host ""

# Step 1
Write-Host "STEP 1: Delete old subscriptions from Supabase" -ForegroundColor Green
Write-Host "1. Open: https://app.supabase.com/projects"
Write-Host "2. Go to: SQL Editor"
Write-Host "3. Run: DELETE FROM push_subscriptions;"
Write-Host "4. Should show: 0 rows"
Write-Host ""
Read-Host "Press ENTER when done"

# Step 2
Write-Host ""
Write-Host "STEP 2: Clear browser storage" -ForegroundColor Green
Write-Host "1. Go to: http://localhost:5174/"
Write-Host "2. Press: F12 (DevTools)"
Write-Host "3. Click: Application tab"
Write-Host "4. Unregister service worker"
Write-Host "5. Clear Local Storage"
Write-Host "6. Hard refresh: Ctrl+Shift+R"
Write-Host ""
Read-Host "Press ENTER when done"

# Step 3
Write-Host ""
Write-Host "STEP 3: Enable fresh notifications" -ForegroundColor Green
Write-Host "1. Click: Bell icon"
Write-Host "2. Click: Enable"
Write-Host "3. Allow: Notifications"
Write-Host ""
Read-Host "Press ENTER when enabled"

# Step 4
Write-Host ""
Write-Host "STEP 4: Test from admin panel" -ForegroundColor Green
Write-Host "1. Click: Admin"
Write-Host "2. Password: edu51five2025"
Write-Host "3. Find: Broadcast Push Notification"
Write-Host "4. Enter test notification"
Write-Host "5. Click: Send to All Subscribers"
Write-Host "6. Minimize browser"
Write-Host "7. Check: Bottom-right corner"
Write-Host ""
Write-Host "SUCCESS = Notification appears!" -ForegroundColor Green
Write-Host ""
